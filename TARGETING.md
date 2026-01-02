# How Targeting Works

Technical documentation for the two-burn impulsive maneuver targeting module.

## Overview

The targeting module solves **position targeting with optional velocity specification** using an **iterative shooting method**. The problem is formulated in ROE (Relative Orbital Elements) space for propagation, leveraging the Koenig et al. (2017) STMs, then converts to RIC (Radial-Intrack-Crosstrack) for the boundary-value problem.

### Problem Statement

```
Given:  Initial RIC state (position + velocity)
        Target RIC position
        Target RIC velocity (optional, defaults to zero)
        Time of flight (TOF)

Find:   dv1 (departure burn at t=0)
        dv2 (arrival burn at t=TOF)

Such that:
        arrival_position = target_position
        arrival_velocity + dv2 = target_velocity
```

---

## Mathematical Foundations

### 1. State Space Bridge: The T Matrix

The transformation matrix T maps ROE to RIC state vectors:

```
[R, I, C, vR, vI, vC]^T = T(chief) * [da, dlambda, dex, dey, dix, diy]^T
```

**Implementation**: `src/orbital/transforms/roe-ric.ts`

**Key design choices:**

1. **True anomaly formulation** - Uses nu (true anomaly) instead of M (mean anomaly)
2. **Instantaneous radius** - Uses r = a(1-e^2)/(1+e*cos(nu)) instead of semi-major axis a
3. **Velocity components** - Accounts for radial velocity (dr/dt) and angular velocity (d(theta)/dt)

This makes the transformation valid for **arbitrary eccentricity** orbits, not just near-circular.

**Block structure:**

The T matrix has natural 4x4 + 2x2 block structure due to in-plane/out-of-plane decoupling:

```
T = [ A_4x4 |  0    ]   A: in-plane (R, I, vR, vI) <-> (da, dlambda, dex, dey)
    [-------|-------]
    [   0   | B_2x2 ]   B: out-of-plane (C, vC) <-> (dix, diy)
```

This structure is exploited for efficient matrix inversion via separate 4x4 and 2x2 inversions.

**Position transformation (rows 0-2):**

```
R = r*da - r*cos(theta)*dex - r*sin(theta)*dey
I = r*dlambda + 2*r*sin(theta)*dex - 2*r*cos(theta)*dey
C = r*sin(theta)*dix - r*cos(theta)*diy
```

Where theta = omega + nu (argument of latitude with true anomaly).

**Reference**: D'Amico, S., "Autonomous Formation Flying in Low Earth Orbit," PhD Thesis, TU Delft, 2010, Section 2.1.3

---

### 2. Control Influence Matrix: The B Matrix

The 6x3 B matrix maps impulsive delta-v in RIC frame to instantaneous ROE change:

```
d(ROE) = B * [dvR, dvI, dvC]^T
```

**Implementation**: `src/orbital/targeting/control-matrix.ts`

**Matrix structure (D'Amico 2010, Eq. 2.38):**

```
              dvR              dvI             dvC
            ------------------------------------------------
d(da)     = [   0              2/(n*a)          0          ]
d(dlambda)= [ -2/(n*a)           0              0          ]
d(dex)    = [ sin(u)/(n*a)    2*cos(u)/(n*a)    0          ]
d(dey)    = [-cos(u)/(n*a)    2*sin(u)/(n*a)    0          ]
d(dix)    = [   0                0           cos(u)/(n*a)  ]
d(diy)    = [   0                0           sin(u)/(n*a)  ]
```

Where:
- n = mean motion [rad/s]
- a = semi-major axis [m]
- u = omega + nu = argument of latitude [rad]

**Physical interpretation of the sparsity:**

| Burn Direction | Affects | Physical Meaning |
|----------------|---------|------------------|
| In-track (dvI) | da, dex, dey | Changes orbital energy and rotates eccentricity vector |
| Radial (dvR) | dlambda, dex, dey | Changes phase and rotates eccentricity vector |
| Cross-track (dvC) | dix, diy | Only affects inclination vector |

**Key insight**: A single burn can only control 3 DOF (the 3 components of delta-v). Full 6-DOF ROE control requires **two burns** at different orbital positions, which is why we use two-burn targeting.

---

## The Shooting Algorithm

**Implementation**: `src/orbital/targeting/rendezvous.ts`

The solver uses Newton-Raphson iteration on the departure burn dv1:

```
Algorithm: solveRendezvous(initialState, targetPosition, chief, tof, options)

1. Convert initial RIC state to ROE:
   ROE_initial = T^-1 * [position, velocity]^T

2. Initialize dv1 with CW approximation (see Initial Guess section)

3. Repeat until converged:
   a. Apply dv1 to initial ROE:
      ROE_after_dv1 = ROE_initial + B * dv1

   b. Propagate using STM over TOF:
      ROE_arrival = STM(tof) * ROE_after_dv1
      (also updates chief orbital elements)

   c. Convert arrival ROE to RIC:
      RIC_arrival = T(chief_arrival) * ROE_arrival

   d. Compute position error:
      error = target_position - arrival_position

   e. Check convergence:
      if ||error|| < tolerance (default 0.1 m): break

   f. Compute Jacobian via central differences:
      J[i,j] = (pos(dv1 + eps*e_j) - pos(dv1 - eps*e_j)) / (2*eps)

   g. Newton-Raphson update with damping:
      dv1_correction = J^-1 * error
      dv1 = dv1 + damping * dv1_correction

4. Compute dv2 to achieve target velocity:
   dv2 = target_velocity - arrival_velocity

5. Return maneuver leg with dv1, dv2, convergence info
```

### Jacobian Computation

The Jacobian d(arrival_position)/d(dv1) is computed via **central differences**:

```
For each component j in {0, 1, 2}:
    dv1_plus  = dv1 + eps * e_j    (eps = 1e-4 m/s)
    dv1_minus = dv1 - eps * e_j

    pos_plus  = propagate(ROE_initial + B*dv1_plus, tof)
    pos_minus = propagate(ROE_initial + B*dv1_minus, tof)

    J[:,j] = (pos_plus - pos_minus) / (2*eps)
```

Central differences provide better accuracy than forward differences.

### Damping Schedule

To improve convergence stability, damping varies by iteration:

| Iterations | Damping Factor |
|------------|----------------|
| 0-2        | 0.5            |
| 3-9        | 0.8            |
| 10+        | 1.0            |

Early damping prevents overshooting when far from the solution.

### Singularity Handling

If the Jacobian is singular (det ~ 0), the solver falls back to gradient descent:

```
dv1_correction = position_error  (instead of J^-1 * error)
```

---

## Initial Guess: Clohessy-Wiltshire Approximation

**Implementation**: `src/orbital/targeting/rendezvous.ts`, function `computeInitialGuess`

For faster convergence, the initial dv1 estimate uses the Clohessy-Wiltshire (Hill) equations:

**Short transfers (nt < 0.1):**
```
dv = [dx/tof - vx0, dy/tof - vy0, dz/tof - vz0]
```

**Longer transfers:**
```
dvx = (dx * n) / (2 * (1 - cos(nt))) - vx0
dvy = (dy * n) / (4*sin(nt) - 3*nt) - ... - vy0
dvz = ((dz - z0*cos(nt)) * n) / sin(nt) - vz0
```

The guess is capped to +/- 10 m/s to prevent divergence from unreasonable starting points.

---

## Integration with Koenig STMs

The propagation step uses the State Transition Matrices from Koenig, Guffanti, D'Amico (2017):

| STM Type | Paper Reference | When Used |
|----------|-----------------|-----------|
| Keplerian | Equation 12 | `includeJ2: false, includeDrag: false` |
| J2-perturbed | Section V, Appendix A | `includeJ2: true, includeDrag: false` |
| J2 + Drag (eccentric) | Section VII, Appendix C | `includeDrag: true, e >= 0.05` |
| J2 + Drag (arbitrary) | Section VIII, Appendix D | `includeDrag: true, e < 0.05` |

**Implementation**: `src/orbital/propagation/propagate.ts`

The `propagateROEWithChief()` function:

1. Selects the appropriate STM based on options
2. Applies the STM: `ROE(t) = STM(t) * ROE(0)`
3. Updates chief orbital elements to account for J2 secular drift:
   - Mean anomaly: M_new = M + n * dt
   - Argument of perigee: omega_new = omega + kappa*Q * dt
   - RAAN: Omega_new = Omega - 2*kappa*R * dt

Where kappa, Q, R are orbital factors from Equations 14-16.

---

## Target Velocity Support

The solver supports **optional target velocity specification**, not just velocity nulling:

```typescript
const options: TargetingOptions = {
  targetVelocity: [0, 0.5, 0],  // Arrive with 0.5 m/s in-track drift
  // ... other options
};
```

When `targetVelocity` is omitted, it defaults to `[0, 0, 0]` (stationary rendezvous).

The arrival burn is computed as:
```
dv2 = target_velocity - arrival_velocity
```

**Use cases:**
- **Stationary rendezvous**: `targetVelocity = [0, 0, 0]`
- **Fly-by inspection**: Non-zero velocity for continuous motion past target
- **Waypoint chaining**: Set up favorable velocity for the next leg

---

## TOF Optimization

**Implementation**: `src/orbital/targeting/tof-optimizer.ts`

### Golden Section Search

The `optimizeTOF()` function finds the TOF that minimizes total delta-v:

```
Cost(TOF) = ||dv1(TOF)|| + ||dv2(TOF)||

Search bounds: [0.5 * T_orbital, 3.0 * T_orbital]
Tolerance: 1% of orbital period
```

Golden section search is derivative-free and handles non-smooth cost functions robustly.

### Multi-Start Optimization

The `optimizeTOFMultiStart()` function handles multiple local minima (e.g., different revolution options):

1. Sample TOF values uniformly across search range
2. Evaluate cost at each sample
3. Find the best sample
4. Refine locally with golden section search

---

## Mission Planning

**Implementation**: `src/orbital/targeting/planner.ts`

### Waypoint Chaining

The `planMission()` function chains multiple two-burn legs:

```
[Start] --dv1--> coast --dv2--> [WP1] --dv1--> coast --dv2--> [WP2] --dv1--> coast --dv2--> [WP3]
         leg 1                          leg 2                          leg 3
```

Each leg is solved independently. The arrival state of leg N (after applying dv2) becomes the initial state of leg N+1.

### Replanning

The `replanFromWaypoint()` function supports incremental replanning:

- Keeps converged legs before the modification point
- Replans only from the modified waypoint onward
- Useful for interactive mission editing

### Mission State Query

The `getMissionStateAtTime()` function returns the RIC state at any time during the mission by:

1. Finding the appropriate leg
2. Propagating from leg start to the query time
3. Converting ROE to RIC

---

## Trajectory Generation

**Implementation**: `src/orbital/targeting/trajectory.ts`

### Dense Output for Visualization

The `generateLegTrajectory()` function produces dense trajectory points:

```typescript
const trajectory = generateLegTrajectory(leg, chief, {
  numPoints: 100,      // Points per leg
  includeJ2: true,
  includeDrag: false,
});
// Returns: Array<{ time, position, velocity }>
```

**Algorithm:**
1. Apply dv1 to initial ROE
2. For each time step:
   - Propagate ROE to that time
   - Convert to RIC
   - Store position/velocity

### Maneuver Markers

The `generateTrajectoryWithManeuvers()` function includes separate arrays for burn locations:

```typescript
const result = generateTrajectoryWithManeuvers(mission, chief, options);
// result.trajectory - dense path
// result.departureBurns - positions where dv1 occurs
// result.arrivalBurns - positions where dv2 occurs
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/orbital/targeting/control-matrix.ts` | B matrix (Gauss VE) |
| `src/orbital/targeting/rendezvous.ts` | Two-burn shooting solver |
| `src/orbital/transforms/roe-ric.ts` | T matrix (ROE <-> RIC) |
| `src/orbital/targeting/tof-optimizer.ts` | TOF optimization |
| `src/orbital/targeting/planner.ts` | Mission planning |
| `src/orbital/targeting/trajectory.ts` | Visualization output |
| `src/orbital/targeting/validation.ts` | Configuration validation |
| `src/orbital/propagation/propagate.ts` | ROE propagation with STMs |

---

## References

1. Koenig, A.W., Guffanti, T., D'Amico, S., "New State Transition Matrices for Spacecraft Relative Motion in Perturbed Orbits," Journal of Guidance, Control, and Dynamics, Vol. 40, No. 7, 2017.
   https://arc.aiaa.org/doi/10.2514/1.G002409

2. D'Amico, S., "Autonomous Formation Flying in Low Earth Orbit," PhD Thesis, TU Delft, 2010.
