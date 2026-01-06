# How J2 and Drag Models Work

Technical documentation for the State Transition Matrix (STM) implementations based on Koenig, Guffanti, D'Amico (2017).

## Overview

The koenig-roe library provides three levels of fidelity for propagating Relative Orbital Elements (ROE):

| Model               | Matrix Size | Perturbations          | Paper Reference                   |
| ------------------- | ----------- | ---------------------- | --------------------------------- |
| Keplerian           | 6x6         | None (two-body)        | Section IV, Equation 12           |
| J2                  | 6x6         | Earth oblateness       | Section V, Appendix A (Eq. A6)    |
| J2+Drag (Eccentric) | 7x7         | J2 + differential drag | Section VII, Appendix C (Eq. C2)  |
| J2+Drag (Arbitrary) | 9x9         | J2 + differential drag | Section VIII, Appendix D (Eq. D2) |

Each model builds upon the previous: the drag STMs embed the J2 STM as a 6x6 block.

---

## Mathematical Foundations

### 1. Quasi-Nonsingular ROE State Vector

The library uses the quasi-nonsingular ROE formulation (Paper Section II, Equation 2):

```
delta-alpha = [da, dlambda, dex, dey, dix, diy]^T
```

| Element | Definition                                                        | Physical Meaning                      |
| ------- | ----------------------------------------------------------------- | ------------------------------------- |
| da      | (a_d - a_c) / a_c                                                 | Relative semi-major axis (normalized) |
| dlambda | (M_d + omega_d) - (M_c + omega_c) + (Omega_d - Omega_c)\*cos(i_c) | Relative mean longitude               |
| dex     | e_d*cos(omega_d) - e_c*cos(omega_c)                               | Relative eccentricity (x-component)   |
| dey     | e_d*sin(omega_d) - e_c*sin(omega_c)                               | Relative eccentricity (y-component)   |
| dix     | i_d - i_c                                                         | Relative inclination                  |
| diy     | (Omega_d - Omega_c)\*sin(i_c)                                     | Relative RAAN (projected)             |

**Implementation**: `src/orbital/types/vectors.ts`

---

### 2. Orbital Factors

The J2 and drag STMs depend on orbital factors defined in Equations 14-16:

**Implementation**: `src/orbital/math/orbital-factors.ts`

#### The Kappa Factor (Equation 14)

The fundamental J2 perturbation magnitude:

```
kappa = (3/4) * J2 * R_E^2 * sqrt(mu) / (a^3.5 * eta^4)
```

where:

- J2 = 1.08263e-3 (Earth oblateness from EGM2008)
- R_E = 6.3781e6 m (Earth equatorial radius, WGS84)
- mu = 3.986004418e14 m^3/s^2 (gravitational parameter)
- eta = sqrt(1 - e^2)

#### Eccentricity and Inclination Factors (Equations 15-16)

| Factor | Definition      | Physical Role               |
| ------ | --------------- | --------------------------- |
| eta    | sqrt(1 - e^2)   | Eccentricity factor         |
| E      | 1 + eta         | J2 mean longitude coupling  |
| F      | 4 + 3\*eta      | J2 eccentricity coupling    |
| G      | 1 / eta^2       | Amplifies effects near e=0  |
| P      | 3\*cos^2(i) - 1 | Mean longitude drift factor |
| Q      | 5\*cos^2(i) - 1 | Apsidal precession rate     |
| R      | cos(i)          | Nodal regression rate       |
| S      | 2*sin(i)*cos(i) | Cross-plane coupling        |
| T      | sin^2(i)        | Higher-order inclination    |

**Key Insight**: Q ranges from -1 (equatorial) to +4 (polar), causing dramatically different apsidal precession rates depending on inclination.

---

### 3. Apsidal Precession State

J2 causes the argument of perigee to precess at rate:

```
omega_dot = kappa * Q
```

Over propagation time tau:

```
omega_f = omega_i + kappa * Q * tau
w_tau = kappa * Q * tau (rotation angle)
```

**Implementation**: `src/orbital/math/orbital-factors.ts`

The apsidal state provides:

- Initial eccentricity components: ex_i = e*cos(omega_i), ey_i = e*sin(omega_i)
- Final eccentricity components: ex_f = e*cos(omega_f), ey_f = e*sin(omega_f)
- Rotation terms: cos(w_tau), sin(w_tau)

---

## Keplerian STM

**Reference**: Paper Section IV, Equation 12

**Implementation**: `src/orbital/stm/keplerian.ts`

The simplest STM captures only energy-induced along-track drift:

```
Phi_kep = I + A_kep * tau

where A_kep[1][0] = -3n/2 (only non-zero element)
```

### Matrix Structure

```
     da  dlam  dex  dey  dix  diy
    ------------------------------------
da  | 1    0    0    0    0    0  |
dlam| a21  1    0    0    0    0  |    a21 = -1.5 * n * tau
dex | 0    0    1    0    0    0  |
dey | 0    0    0    1    0    0  |
dix | 0    0    0    0    1    0  |
diy | 0    0    0    0    0    1  |
    ------------------------------------
```

### Physical Interpretation

- **Only coupling**: d(dlambda)/dt = -3n/2 \* da
- A difference in semi-major axis (da) causes a difference in mean motion
- This difference in mean motion causes along-track drift (dlambda grows linearly)
- All other ROE elements are constants of Keplerian motion

---

## J2 STM

**Reference**: Paper Section V, Appendix A3, Equation A6

**Implementation**: `src/orbital/stm/j2.ts`

The J2 STM captures three secular effects:

1. **Apsidal precession**: Argument of perigee rotates, causing eccentricity vector rotation
2. **Nodal regression**: RAAN drifts, causing delta-iy drift
3. **Additional mean longitude drift**: Beyond Keplerian energy drift

### Physical Effects by ROE Element

| Element  | J2 Effect                       | Matrix Row                        |
| -------- | ------------------------------- | --------------------------------- |
| da       | Constant (no secular J2 effect) | Row 1: [1, 0, 0, 0, 0, 0]         |
| dlambda  | Keplerian + J2 drift            | Row 2: complex coupling           |
| dex, dey | Rotation (apsidal precession)   | Rows 3-4: 2x2 rotation + coupling |
| dix      | Constant (no secular J2 effect) | Row 5: [0, 0, 0, 0, 1, 0]         |
| diy      | Drift (nodal regression)        | Row 6: da, dex, dey, dix coupling |

### Complete 6x6 Matrix Structure

```typescript
Phi_J2 = [
  // Row 1: delta-a is constant
  [1, 0, 0, 0, 0, 0],

  // Row 2: delta-lambda evolution (Keplerian + J2)
  [
    -(1.5 * n + 3.5 * kappa * E * P) * tau, // da coupling (Keplerian + J2)
    1, // identity
    kappa * ex_i * F * G * P * tau, // dex_i coupling
    kappa * ey_i * F * G * P * tau, // dey_i coupling
    -kappa * F * S * tau, // dix coupling
    0,
  ],

  // Row 3: delta-ex evolution (apsidal precession)
  [
    3.5 * kappa * ey_f * Q * tau, // da coupling
    0,
    cos(w_tau) - 4 * kappa * ex_i * ey_f * G * Q * tau, // rotation + coupling
    -sin(w_tau) - 4 * kappa * ey_i * ey_f * G * Q * tau, // rotation + coupling
    5 * kappa * ey_f * S * tau, // dix coupling
    0,
  ],

  // Row 4: delta-ey evolution (apsidal precession)
  [
    -3.5 * kappa * ex_f * Q * tau, // da coupling
    0,
    sin(w_tau) + 4 * kappa * ex_i * ex_f * G * Q * tau, // rotation + coupling
    cos(w_tau) + 4 * kappa * ey_i * ex_f * G * Q * tau, // rotation + coupling
    -5 * kappa * ex_f * S * tau, // dix coupling
    0,
  ],

  // Row 5: delta-ix is constant
  [0, 0, 0, 0, 1, 0],

  // Row 6: delta-iy evolution (nodal regression)
  [
    3.5 * kappa * S * tau, // da coupling
    0,
    -4 * kappa * ex_i * G * S * tau, // dex_i coupling
    -4 * kappa * ey_i * G * S * tau, // dey_i coupling
    2 * kappa * T * tau, // dix coupling
    1,
  ],
];
```

### Row-by-Row Breakdown

**Row 2 (delta-lambda):**

- Term -(1.5*n)*tau: Keplerian drift from semi-major axis difference
- Term -(3.5*kappa*E*P)*tau: Additional J2-induced drift
- Terms with F*G*P: Eccentricity couples into mean longitude via J2
- Term -kappa*F*S\*tau: Inclination difference affects mean longitude drift

**Rows 3-4 (delta-ex, delta-ey):**

- cos(w_tau), sin(w_tau): 2D rotation matrix for apsidal precession
- The eccentricity vector rotates at rate omega_dot = kappa\*Q
- Magnitude is preserved (isotropic rotation)
- Additional terms couple semi-major axis, initial eccentricity, and inclination

**Row 6 (delta-iy):**

- Nodal regression causes delta-iy to drift
- Coupling through S = 2*sin(i)*cos(i) reflects nodal geometry
- RAAN differential drifts due to energy (da), eccentricity, and inclination differences

---

## J2+Drag Eccentric Model

**Reference**: Paper Section VII, Equations 69-72, Appendix C, Equation C2

**Implementation**: `src/orbital/stm/drag-eccentric.ts`

**Validity**: Requires e >= 0.05

### The Circularization Constraint (Equation 69)

This model assumes drag causes orbits to circularize:

```
delta-e-dot = (1 - e) * delta-a-dot
```

This physically reasonable constraint reduces the problem from 3 drag parameters to 1, because:

- Drag primarily reduces semi-major axis (energy loss)
- Eccentricity decreases proportionally as the orbit circularizes
- The eccentricity drift direction aligns with the apsidal line

### 7D Augmented State

```
[da, dlambda, dex, dey, dix, diy, delta-a-dot]^T
```

The drag derivative delta-a-dot is treated as a constant parameter that persists through propagation.

### Matrix Structure

```
     da  dlam  dex  dey  dix  diy  da-dot
    ----------------------------------------
da  |         Phi_J2 (6x6)        | tau    |
dlam|                             | c2     |
dex |                             | c3     |
dey |                             | c4     |
dix |                             | 0      |
diy |                             | c6     |
    |-------------------------------------|
da-dot | 0   0    0    0    0    0   1    |
    ----------------------------------------
```

### Drag Column (Column 7) from Equation C2

```typescript
dragColumn = [
  // delta-a: linear drift
  tau,

  // delta-lambda: Keplerian + J2 coupling
  ((-0.75 * n -
    1.75 * kappa * eta * P +
    1.5 * kappa * e * (1 - e) * eta * G * P) *
    tau) ^
    2,

  // delta-ex: Circularization + J2 coupling
  ((1 - e) * cos(omega_f) * tau -
    kappa * ey_f * Q * (-1.75 + 2 * e * (1 - e) * G) * tau) ^
    2,

  // delta-ey: Circularization + J2 coupling
  ((1 - e) * sin(omega_f) * tau +
    kappa * ex_f * Q * (-1.75 + 2 * e * (1 - e) * G) * tau) ^
    2,

  // delta-ix: no drag effect
  0,

  // delta-iy: J2-drag coupling
  (kappa * S * (1.75 - 2 * e * (1 - e) * G) * tau) ^ 2,
];
```

### Physical Interpretation

| Row      | Effect                                                    | Time Dependence   |
| -------- | --------------------------------------------------------- | ----------------- |
| da       | Linear semi-major axis change                             | O(tau)            |
| dlambda  | Quadratic drift (drag causes energy loss -> faster drift) | O(tau^2)          |
| dex, dey | Linear circularization + quadratic J2-drag coupling       | O(tau) + O(tau^2) |
| dix      | No effect (drag doesn't change inclination)               | 0                 |
| diy      | Quadratic J2-drag nodal coupling                          | O(tau^2)          |

---

## J2+Drag Arbitrary Model

**Reference**: Paper Section VIII, Equations 73-77, Appendix D, Equation D2

**Implementation**: `src/orbital/stm/drag-arbitrary.ts`

**Validity**: Works for any eccentricity, including near-circular (e < 0.05)

### No Circularization Constraint

This model treats all three eccentricity-related drag derivatives as independent:

- delta-a-dot: Rate of change of relative semi-major axis
- delta-ex-dot: Rate of change of relative eccentricity x-component
- delta-ey-dot: Rate of change of relative eccentricity y-component

### 9D Augmented State

```
[da, dlambda, dex, dey, dix, diy, delta-a-dot, delta-ex-dot, delta-ey-dot]^T
```

### Matrix Structure

```
     da  dlam  dex  dey  dix  diy  da-dot  dex-dot  dey-dot
    ---------------------------------------------------------
da  |                               |                       |
dlam|                               |                       |
dex |       Phi_J2 (6x6)            |   Drag Columns (6x3)  |
dey |                               |                       |
dix |                               |                       |
diy |                               |                       |
    |-------------------------------------------------------|
da-dot  | 0   0   0   0   0   0       1       0        0    |
dex-dot | 0   0   0   0   0   0       0       1        0    |
dey-dot | 0   0   0   0   0   0       0       0        1    |
    ---------------------------------------------------------
```

### Drag Columns (Columns 7-9) from Equation D2

**Column 7 (delta-a-dot sensitivity):**

```typescript
dragCol1 = [
  tau, // delta-a: linear
  (-(0.75 * n + 1.75 * kappa * E * P) * tau) ^ 2, // delta-lambda: quadratic
  (1.75 * kappa * ey_f * Q * tau) ^ 2, // delta-ex: J2 coupling
  (-1.75 * kappa * ex_f * Q * tau) ^ 2, // delta-ey: J2 coupling
  0, // delta-ix: no effect
  (1.75 * kappa * S * tau) ^ 2, // delta-iy: J2-drag nodal
];
```

**Column 8 (delta-ex-dot sensitivity):**

```typescript
dragCol2 = [
  0, // delta-a: no effect
  (0.5 * kappa * e * F * G * P * tau) ^ 2, // delta-lambda: J2 coupling
  (cos(omega_f) * tau - 2 * kappa * e * ey_f * G * Q * tau) ^ 2, // delta-ex: linear + J2
  (sin(omega_f) * tau + 2 * kappa * e * ex_f * G * Q * tau) ^ 2, // delta-ey: linear + J2
  0, // delta-ix: no effect
  (-2 * kappa * e * G * S * tau) ^ 2, // delta-iy: J2 coupling
];
```

**Column 9 (delta-ey-dot sensitivity):**

```typescript
dragCol3 = [
  0, // delta-a: no effect
  0, // delta-lambda: NO J2 coupling (asymmetry!)
  -sin(omega_f) * tau, // delta-ex: rotation only
  cos(omega_f) * tau, // delta-ey: rotation only
  0, // delta-ix: no effect
  0, // delta-iy: NO J2 coupling (asymmetry!)
];
```

### Column Asymmetry

Column 9 (delta-ey-dot) lacks J2-drag coupling terms in rows 2 and 6, unlike column 8 (delta-ex-dot). This asymmetry arises from the quasi-nonsingular state definition where delta-ex aligns with the eccentricity direction.

### Model Comparison

| Aspect          | Eccentric Model     | Arbitrary Model                       |
| --------------- | ------------------- | ------------------------------------- |
| State dimension | 7D                  | 9D                                    |
| Drag parameters | 1 (daDotDrag)       | 3 (daDotDrag, dexDotDrag, deyDotDrag) |
| Constraint      | Circularization     | None                                  |
| Validity        | e >= 0.05           | Any eccentricity                      |
| Use case        | Most LEO satellites | Near-circular, GEO, high-precision    |

---

## Model Interactions and Composition

### J2 Embedding in Drag STMs

Both drag STMs reuse the J2 STM as a component:

```typescript
// In drag-eccentric.ts:91
const phi_j2 = buildJ2Matrix(chief, tau);

// In drag-arbitrary.ts:101
const phi_j2 = buildJ2Matrix(chief, tau);
```

The J2 matrix forms the upper-left 6x6 block of both 7x7 and 9x9 drag STMs.

### J2-Drag Coupling Terms

The drag columns contain kappa-dependent tau^2 terms that couple J2 and drag effects:

| Coupling Term        | Physical Meaning                                         |
| -------------------- | -------------------------------------------------------- |
| kappa*ey_f*Q\*tau^2  | Apsidal precession affects how drag changes eccentricity |
| kappa*S*tau^2        | Drag causes nodal regression through J2 coupling         |
| kappa*e*F*G*P\*tau^2 | Eccentricity-dependent mean longitude drift from drag    |

These are NOT additive approximations - they represent the full nonlinear coupling.

### Why J2 Cannot Be Disabled with Drag

**Implementation**: `src/orbital/propagation/propagate.ts`

```typescript
if (includeDrag && options.includeJ2 === false) {
  throw new Error(
    `Cannot disable J2 when drag is enabled. ` +
      `The drag STMs from Koenig et al. (2017) inherently include J2 effects...`
  );
}
```

**Physical reasoning**: In orbits where drag is significant (LEO), J2 is always the dominant conservative perturbation. The paper provides no drag-only STM because it would be physically unrealistic.

---

## Drag Estimation (Inverse Problem)

**Implementation**: `src/orbital/stm/drag-estimation.ts`

### Batch Least Squares Framework

The drag STMs form a forward model that can be inverted for parameter estimation:

**Forward model (STMs):**

```
ROE(t) = Phi(tau) * [ROE(0); drag_params]
```

**Inverse model (estimation):**

```
drag_params = residual / dt
where residual = ROE_observed - Phi_J2 * ROE_initial
```

### J2 Correction

**Implementation**: `src/orbital/stm/drag-estimation.ts`

The estimator subtracts expected J2-only drift before computing drag:

```typescript
// Propagate with J2-only to get expected drift
const stmJ2 = computeJ2STM(chief, dt);
const expectedJ2 = matVecMul6(stmJ2, roe1);

// Residuals isolate drag contribution
const residuals = roe2 - expectedJ2;

// Finite difference gives drag derivatives
return {
  daDotDrag: residuals[0] / dt,
  dexDotDrag: residuals[2] / dt,
  deyDotDrag: residuals[3] / dt,
};
```

**Note**: J2 does not cause secular drift in relative semi-major axis, so no correction is needed for daDotDrag.

### Converting Between Configurations

**Implementation**: `src/orbital/stm/drag-arbitrary.ts`

```typescript
// Apply circularization constraint to convert 1 param -> 3 params
const eccentricToArbitraryConfig = (daDotDrag, chief) => {
  const deDotDrag = (1 - e) * daDotDrag;
  return {
    daDotDrag,
    dexDotDrag: deDotDrag * Math.cos(omega),
    deyDotDrag: deDotDrag * Math.sin(omega),
  };
};
```

---

## Propagation Workflow

**Implementation**: `src/orbital/propagation/propagate.ts`

### STM Selection Logic

```typescript
if (includeDrag && dragConfig) {
  // Routes to 7x7 or 9x9 STM (always includes J2)
  propagatedVec = propagateWithDrag(stateVec, chief, deltaTime, dragConfig);
} else if (includeJ2) {
  // 6x6 J2 STM
  const stm = computeJ2STM(chief, deltaTime);
  propagatedVec = matVecMul6(stm, stateVec);
} else {
  // 6x6 Keplerian STM
  const stm = computeKeplerianSTM(chief, deltaTime);
  propagatedVec = matVecMul6(stm, stateVec);
}
```

### Drag Model Dispatch

**Implementation**: `src/orbital/propagation/drag-dispatch.ts`

```typescript
if (dragConfig.type === 'eccentric') {
  // Validate e >= 0.05
  if (chief.eccentricity < 0.05) {
    throw new Error('Use arbitrary model for near-circular orbits');
  }
  const { propagate } = computeJ2DragSTMEccentric(chief, tau);
  return propagate(roe, dragConfig.daDotDrag);
} else {
  const { propagate } = computeJ2DragSTMArbitrary(chief, tau);
  return propagate(roe, { daDotDrag, dexDotDrag, deyDotDrag });
}
```

### Chief Orbital Element Updates

**Implementation**: `src/orbital/propagation/propagate.ts`

When propagating ROE, the chief's orbital elements must also be updated:

| Element         | Update Formula                     | Physics                               |
| --------------- | ---------------------------------- | ------------------------------------- |
| Mean anomaly    | M_new = M + n\*dt                  | Keplerian motion                      |
| Arg. of perigee | omega_new = omega + kappa*Q*dt     | J2 apsidal precession                 |
| RAAN            | Omega_new = Omega - 2*kappa*R\*dt  | J2 nodal regression                   |
| Semi-major axis | a_new = a + chiefAbsoluteDaDot\*dt | Optional (implementation convenience) |

The chief update is essential for accurate ROE-to-RIC conversions at the output time.

---

## Key Files Reference

| File                                       | Paper Reference                  | Purpose                       |
| ------------------------------------------ | -------------------------------- | ----------------------------- |
| `src/orbital/stm/keplerian.ts`             | Equation 12                      | Keplerian-only STM            |
| `src/orbital/stm/j2.ts`                    | Appendix A3, Eq. A6              | J2-perturbed STM              |
| `src/orbital/stm/drag-eccentric.ts`        | Section VII, Appendix C, Eq. C2  | 7x7 J2+Drag (e >= 0.05)       |
| `src/orbital/stm/drag-arbitrary.ts`        | Section VIII, Appendix D, Eq. D2 | 9x9 J2+Drag (any e)           |
| `src/orbital/stm/drag-estimation.ts`       | (Implementation)                 | Drag derivative estimation    |
| `src/orbital/math/orbital-factors.ts`      | Equations 13-16                  | kappa, P, Q, R, S, T, E, F, G |
| `src/orbital/propagation/propagate.ts`     | (Implementation)                 | Main propagation API          |
| `src/orbital/propagation/drag-dispatch.ts` | (Implementation)                 | Drag model selection          |

---

## References

1. Koenig, A.W., Guffanti, T., D'Amico, S., "New State Transition Matrices for Spacecraft Relative Motion in Perturbed Orbits," Journal of Guidance, Control, and Dynamics, Vol. 40, No. 7, 2017.
   https://arc.aiaa.org/doi/10.2514/1.G002409

2. D'Amico, S., "Autonomous Formation Flying in Low Earth Orbit," PhD Thesis, TU Delft, 2010.
