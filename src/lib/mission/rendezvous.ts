/**
 * Two-Burn Rendezvous Solver
 *
 * Solves the rendezvous problem: find dv1 (departure) and dv2 (arrival)
 * such that the deputy reaches the target position with zero relative velocity.
 *
 * Uses iterative shooting with Newton-Raphson correction on dv1.
 * Full J2 and optional drag perturbations are included via propagation.
 *
 * Reference: Standard spacecraft targeting techniques with ROE formulation.
 */

import type { ROEPropagationOptions } from "../core/types/config";
import type { ClassicalOrbitalElements } from "../core/types/orbital-elements";
import type { RelativeState, ROEVector, Vector3 } from "../core/types/vectors";
import type { ManeuverLeg, Matrix3x3, TargetingOptions } from "./types";

import { ricToROE, roeToRIC } from "../dynamics/roe-ric";
import { propagateROEWithChief } from "../dynamics/propagation";
import { roeToVector, vectorToROE } from "../dynamics/roe-state";
import { applyDeltaV } from "./control-matrix";
// Note: applyDeltaV is used only for dv1 in propagateWithBurn, not for dv2
import {
  add3,
  invert3x3,
  matMul3x3_3x1,
  negate3,
  norm3,
  sub3,
  ZERO_VECTOR3,
} from "./matrix-utils";

// Default solver parameters
const DEFAULT_MAX_ITERATIONS = 50;
const DEFAULT_POSITION_TOLERANCE = 0.1; // meters
const JACOBIAN_PERTURBATION = 1e-4; // m/s for finite difference

/**
 * Solve the two-burn rendezvous problem.
 *
 * Given an initial RIC state and target position, find:
 * - dv1: departure burn at t=0
 * - dv2: arrival burn at t=tof to null relative velocity
 *
 * The algorithm uses iterative shooting:
 * 1. Guess initial dv1 (zero or approximate)
 * 2. Apply dv1, propagate to tof, compute arrival state
 * 3. Compute dv2 to null arrival velocity
 * 4. Check position error at arrival
 * 5. If error > tolerance, update dv1 using Newton-Raphson
 * 6. Repeat until converged
 * @param initialState - Deputy starting RIC state (position + velocity) [m, m/s]
 * @param targetPosition - Target RIC position [m]
 * @param chief - Chief orbital elements at t=0
 * @param tof - Time of flight [seconds]
 * @param options - Targeting options (J2, drag, tolerances)
 * @returns Maneuver leg with dv1, dv2, and convergence info
 */
export const solveRendezvous = (
  initialState: RelativeState,
  targetPosition: Vector3,
  chief: ClassicalOrbitalElements,
  tof: number,
  options?: TargetingOptions
): ManeuverLeg => {
  const maxIter = options?.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const posTol = options?.positionTolerance ?? DEFAULT_POSITION_TOLERANCE;

  // Build propagation options from targeting options
  const propOptions = {
    includeJ2: options?.includeJ2 ?? true,
    includeDrag: options?.includeDrag ?? false,
    dragConfig: options?.dragConfig,
  };

  // Convert initial RIC state to ROE
  const initialROE = roeToVector(ricToROE(chief, initialState));

  // Initialize dv1 with approximate solution
  let dv1: Vector3 = computeInitialGuess(
    initialState,
    targetPosition,
    chief,
    tof
  );

  let converged = false;
  let iterations = 0;
  let finalPosition: Vector3 = ZERO_VECTOR3;
  let dv2: Vector3 = ZERO_VECTOR3;
  let chiefAtArrival = chief;

  // Track arrival state for final dv2 computation
  let arrivalRIC: RelativeState = {
    position: ZERO_VECTOR3,
    velocity: ZERO_VECTOR3,
  };

  for (let iter = 0; iter < maxIter; iter++) {
    iterations = iter + 1;

    // Forward propagation with current dv1
    const result = propagateWithBurn(initialROE, dv1, chief, tof, propOptions);

    chiefAtArrival = result.chiefAtArrival;
    arrivalRIC = result.arrivalRIC;

    // TARGET ARRIVAL POSITION DIRECTLY (not position after applying dv2)
    // This is the key fix: impulsive burns change velocity, not position
    finalPosition = arrivalRIC.position;

    // Check convergence on position only
    const posError = norm3(sub3(targetPosition, finalPosition));

    if (posError < posTol) {
      converged = true;
      break;
    }

    // Update dv1 using Newton-Raphson with central differences
    const jacobian = computeJacobian(initialROE, dv1, chief, tof, propOptions);

    const positionError = sub3(targetPosition, finalPosition);

    // Handle potential singularity in Jacobian
    let dv1Correction: Vector3;
    try {
      const jacobianInv = invert3x3(jacobian);
      dv1Correction = matMul3x3_3x1(jacobianInv, positionError);
    } catch {
      // Jacobian singular - use gradient descent fallback
      dv1Correction = positionError;
    }

    // Apply correction with damping for stability
    // Use more aggressive damping early, then relax
    let damping: number;
    if (iter < 3) {
      damping = 0.5;
    } else if (iter < 10) {
      damping = 0.8;
    } else {
      damping = 1;
    }
    dv1 = add3(dv1, [
      damping * dv1Correction[0],
      damping * dv1Correction[1],
      damping * dv1Correction[2],
    ]);
  }

  // Compute dv2 AFTER convergence to null arrival velocity
  dv2 = negate3(arrivalRIC.velocity);

  // Compute final position error for diagnostics
  const finalPositionError = norm3(sub3(targetPosition, finalPosition));

  return {
    from: initialState.position,
    to: targetPosition,
    tof,
    burn1: {
      deltaV: dv1,
      magnitude: norm3(dv1),
      chief,
    },
    burn2: {
      deltaV: dv2,
      magnitude: norm3(dv2),
      chief: chiefAtArrival,
    },
    totalDeltaV: norm3(dv1) + norm3(dv2),
    converged,
    iterations,
    positionError: finalPositionError,
  };
};

/**
 * Compute initial guess for dv1 using Clohessy-Wiltshire approximation.
 *
 * For short transfers, uses the CW solution as starting point.
 * @param initialState - Initial RIC state
 * @param targetPosition - Target position
 * @param chief - Chief elements
 * @param tof - Time of flight
 * @returns Initial dv1 guess
 */
const computeInitialGuess = (
  initialState: RelativeState,
  targetPosition: Vector3,
  chief: ClassicalOrbitalElements,
  tof: number
): Vector3 => {
  // Use CW (Hill) equations for initial guess
  // For short transfers, this gives a reasonable starting point

  const n = Math.sqrt(
    chief.gravitationalParameter / Math.pow(chief.semiMajorAxis, 3)
  );
  const nt = n * tof;
  const snt = Math.sin(nt);
  const cnt = Math.cos(nt);

  const [x0, y0, z0] = initialState.position;
  const [vx0, vy0, vz0] = initialState.velocity;
  const [xf, yf, zf] = targetPosition;

  // CW state transition for position:
  // x(t) = (4 - 3*cos(nt))*x0 + sin(nt)/n * vx0 + 2*(1-cos(nt))/n * vy0
  // y(t) = 6*(sin(nt) - nt)*x0 + y0 - 2*(1-cos(nt))/n * vx0 + (4*sin(nt) - 3*nt)/n * vy0
  // z(t) = cos(nt)*z0 + sin(nt)/n * vz0

  // Solve for required velocity change (dv = v_required - v_initial)
  // This is approximate - the iterative solver will refine it

  // Simplified approach: estimate delta-v needed based on position difference
  const dx = xf - x0;
  const dy = yf - y0;
  const dz = zf - z0;

  // Rough estimate assuming nt ~ pi (half orbit transfer)
  // These are just starting values - the solver will converge
  if (Math.abs(nt) < 0.1) {
    // Very short transfer - nearly linear
    return [dx / tof - vx0, dy / tof - vy0, dz / tof - vz0];
  }

  // For longer transfers, use simplified CW inverse
  // The full CW solution is complex; we use a heuristic that works reasonably
  const dvx = (dx * n) / (2 * (1 - cnt)) - vx0;
  const dvy =
    (dy * n) / (4 * snt - 3 * nt) -
    (6 * (snt - nt) * x0 * n) / (4 * snt - 3 * nt) -
    vy0;
  const dvz = ((dz - z0 * cnt) * n) / snt - vz0;

  // Sanity check - cap the guess to reasonable values
  const maxDv = 10; // m/s
  return [
    Math.max(-maxDv, Math.min(maxDv, Number.isNaN(dvx) ? 0 : dvx)),
    Math.max(-maxDv, Math.min(maxDv, Number.isNaN(dvy) ? 0 : dvy)),
    Math.max(-maxDv, Math.min(maxDv, Number.isNaN(dvz) ? 0 : dvz)),
  ];
};

/**
 * Propagate ROE with initial delta-v applied.
 * @param initialROE - Initial ROE vector
 * @param dv1 - Departure delta-v
 * @param chief - Chief at departure
 * @param tof - Time of flight
 * @param propOptions - Propagation options
 * @returns Arrival state and chief
 */
const propagateWithBurn = (
  initialROE: ROEVector,
  dv1: Vector3,
  chief: ClassicalOrbitalElements,
  tof: number,
  propOptions: ROEPropagationOptions
): { arrivalRIC: RelativeState; chiefAtArrival: ClassicalOrbitalElements } => {
  // Apply dv1 to initial ROE
  const roeAfterDv1 = applyDeltaV(initialROE, dv1, chief);

  // Propagate to arrival
  const { roe: roeAtArrival, chief: chiefAtArrival } = propagateROEWithChief(
    vectorToROE(roeAfterDv1),
    chief,
    tof,
    propOptions
  );

  // Convert to RIC at arrival
  const arrivalRIC = roeToRIC(chiefAtArrival, roeAtArrival);

  return { arrivalRIC, chiefAtArrival };
};

/**
 * Compute Jacobian d(arrival_position)/d(dv1) via central differences.
 *
 * Uses central differences for better accuracy than forward differences.
 * Targets ARRIVAL position, not position-after-dv2.
 * @param initialROE - Initial ROE vector
 * @param dv1 - Current dv1 estimate
 * @param chief - Chief at departure
 * @param tof - Time of flight
 * @param propOptions - Propagation options
 * @returns 3x3 Jacobian matrix
 */
const computeJacobian = (
  initialROE: ROEVector,
  dv1: Vector3,
  chief: ClassicalOrbitalElements,
  tof: number,
  propOptions: ROEPropagationOptions
): Matrix3x3 => {
  const eps = JACOBIAN_PERTURBATION;

  // Compute partial derivatives using central differences
  const columns: [Vector3, Vector3, Vector3] = [
    computeArrivalPositionDerivative(
      initialROE,
      dv1,
      0,
      eps,
      chief,
      tof,
      propOptions
    ),
    computeArrivalPositionDerivative(
      initialROE,
      dv1,
      1,
      eps,
      chief,
      tof,
      propOptions
    ),
    computeArrivalPositionDerivative(
      initialROE,
      dv1,
      2,
      eps,
      chief,
      tof,
      propOptions
    ),
  ];

  // Transpose to get rows (Jacobian is d(position)/d(dv1))
  return [
    [columns[0][0], columns[1][0], columns[2][0]],
    [columns[0][1], columns[1][1], columns[2][1]],
    [columns[0][2], columns[1][2], columns[2][2]],
  ];
};

/**
 * Compute partial derivative of ARRIVAL position with respect to dv1 component.
 *
 * Uses central difference: (f(x+eps) - f(x-eps)) / (2*eps)
 * This is more accurate than forward difference and targets arrival position directly.
 * @param initialROE - Initial ROE
 * @param dv1 - Current dv1
 * @param component - Which component to perturb (0, 1, or 2)
 * @param eps - Perturbation size
 * @param chief - Chief at departure
 * @param tof - Time of flight
 * @param propOptions - Propagation options
 * @returns Partial derivative vector
 */
const computeArrivalPositionDerivative = (
  initialROE: ROEVector,
  dv1: Vector3,
  component: 0 | 1 | 2,
  eps: number,
  chief: ClassicalOrbitalElements,
  tof: number,
  propOptions: ROEPropagationOptions
): Vector3 => {
  // Perturb dv1 in positive direction
  const dv1Plus: Vector3 = [
    dv1[0] + (component === 0 ? eps : 0),
    dv1[1] + (component === 1 ? eps : 0),
    dv1[2] + (component === 2 ? eps : 0),
  ];

  // Perturb dv1 in negative direction
  const dv1Minus: Vector3 = [
    dv1[0] - (component === 0 ? eps : 0),
    dv1[1] - (component === 1 ? eps : 0),
    dv1[2] - (component === 2 ? eps : 0),
  ];

  // Propagate with perturbed dv1 values
  const resultPlus = propagateWithBurn(
    initialROE,
    dv1Plus,
    chief,
    tof,
    propOptions
  );
  const resultMinus = propagateWithBurn(
    initialROE,
    dv1Minus,
    chief,
    tof,
    propOptions
  );

  // Get ARRIVAL positions directly (not position-after-dv2)
  const pPlus = resultPlus.arrivalRIC.position;
  const pMinus = resultMinus.arrivalRIC.position;

  // Central difference: (f(x+eps) - f(x-eps)) / (2*eps)
  const twoEps = 2 * eps;
  return [
    (pPlus[0] - pMinus[0]) / twoEps,
    (pPlus[1] - pMinus[1]) / twoEps,
    (pPlus[2] - pMinus[2]) / twoEps,
  ];
};
