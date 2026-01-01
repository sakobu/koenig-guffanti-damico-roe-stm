/**
 * ROE Propagation Module
 *
 * Provides the main propagation API for relative orbital elements.
 *
 * Reference: Koenig, Guffanti, D'Amico (2017)
 * "New State Transition Matrices for Spacecraft Relative Motion in Perturbed Orbits"
 */

// Main propagation functions
export {
  generateROETrajectory,
  propagateROE,
  propagateROEWithChief,
} from './propagate';

// Drag dispatch (internal, but exported for advanced users)
export { propagateWithDrag } from './drag-dispatch';
