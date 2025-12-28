/**
 * Matrix type definitions for State Transition Matrices and control.
 *
 * References:
 * - Koenig, Guffanti, D'Amico (2017) "New State Transition Matrices..."
 * - D'Amico (2010) PhD Thesis, TU Delft
 */

import type { Vector3 } from "./vectors";

// ============================================================================
// STM Row Types
// ============================================================================

/**
 * Row type for 6x6 STM.
 * Columns correspond to ROE elements: [da, dlambda, dex, dey, dix, diy]
 */
export type Row6 = readonly [
  col0: number,
  col1: number,
  col2: number,
  col3: number,
  col4: number,
  col5: number
];

/**
 * Row type for 7x7 STM (eccentric drag model).
 * Columns: [da, dlambda, dex, dey, dix, diy, daDotDrag]
 */
export type Row7 = readonly [
  col0: number,
  col1: number,
  col2: number,
  col3: number,
  col4: number,
  col5: number,
  col6: number
];

/**
 * Row type for 9x9 STM (arbitrary drag model).
 * Columns: [da, dlambda, dex, dey, dix, diy, daDotDrag, dexDotDrag, deyDotDrag]
 */
export type Row9 = readonly [
  col0: number,
  col1: number,
  col2: number,
  col3: number,
  col4: number,
  col5: number,
  col6: number,
  col7: number,
  col8: number
];

/**
 * Row of drag contributions (3 elements: da-dot, dex-dot, dey-dot).
 */
export type DragRow3 = readonly [daDot: number, dexDot: number, deyDot: number];

// ============================================================================
// State Transition Matrices
// ============================================================================

/**
 * 6x6 State Transition Matrix.
 *
 * Used for propagating the 6-element ROE state vector forward in time.
 * Phi(t, t0)
 * Rows correspond to output ROE elements: [da, dlambda, dex, dey, dix, diy]
 */
export type STM6 = readonly [
  rowDa: Row6,
  rowDlambda: Row6,
  rowDex: Row6,
  rowDey: Row6,
  rowDix: Row6,
  rowDiy: Row6
];

/**
 * 7x7 State Transition Matrix for eccentric orbit drag model.
 * Augments 6x6 J2 STM with drag column.
 */
export type STM7 = readonly [
  rowDa: Row7,
  rowDlambda: Row7,
  rowDex: Row7,
  rowDey: Row7,
  rowDix: Row7,
  rowDiy: Row7,
  rowDaDotDrag: Row7
];

/**
 * 9x9 State Transition Matrix for arbitrary eccentricity drag model.
 * Augments 6x6 J2 STM with three drag columns.
 */
export type STM9 = readonly [
  rowDa: Row9,
  rowDlambda: Row9,
  rowDex: Row9,
  rowDey: Row9,
  rowDix: Row9,
  rowDiy: Row9,
  rowDaDotDrag: Row9,
  rowDexDotDrag: Row9,
  rowDeyDotDrag: Row9
];

/**
 * 6x3 matrix of drag column contributions for arbitrary drag model.
 * Each row corresponds to one ROE element, columns are the three drag derivatives.
 */
export type DragColumns6x3 = readonly [
  rowDa: DragRow3,
  rowDlambda: DragRow3,
  rowDex: DragRow3,
  rowDey: DragRow3,
  rowDix: DragRow3,
  rowDiy: DragRow3
];

// ============================================================================
// Control and Utility Matrices
// ============================================================================

/**
 * 6x3 Control Influence Matrix.
 *
 * Maps RIC delta-v [dvR, dvI, dvC] to instantaneous ROE change.
 * Derived from Gauss Variational Equations (D'Amico 2010, Eq. 2.38).
 */
export type ControlMatrix6x3 = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
];

/**
 * 3x6 matrix for position extraction or transpose operations.
 */
export type Matrix3x6 = readonly [
  readonly [number, number, number, number, number, number],
  readonly [number, number, number, number, number, number],
  readonly [number, number, number, number, number, number],
];

/**
 * 3x3 matrix for linear system solving.
 */
export type Matrix3x3 = readonly [Vector3, Vector3, Vector3];
