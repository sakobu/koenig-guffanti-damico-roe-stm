/**
 * Format a number with sign and fixed decimals
 */
export function formatValue(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}`;
}

/**
 * Round a number to 2 decimal places
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Format a 3D position vector for display
 */
export function formatPosition(pos: readonly [number, number, number]): string {
  return `[${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}, ${pos[2].toFixed(1)}]`;
}

/**
 * Convert drag coefficient to slider value (1-100 scale)
 * Maps -1e-9 (strong) to -1e-11 (weak) using logarithmic scale
 */
export function dragToSlider(drag: number): number {
  const exp = Math.log10(-drag);
  return Math.round(((exp + 11) / 2) * 100);
}

/**
 * Convert slider value (1-100) to drag coefficient
 * Inverse of dragToSlider
 */
export function sliderToDrag(slider: number): number {
  const exp = (slider / 100) * 2 - 11;
  return -Math.pow(10, exp);
}

/**
 * Convert eccentricity derivative to bipolar slider value (0-100, centered at 50)
 * Handles both positive and negative values
 */
export function eccentricityDragToSlider(drag: number): number {
  if (drag === 0) return 50;
  const sign = Math.sign(drag);
  const absVal = Math.abs(drag);
  const exp = Math.log10(absVal);
  const normalized = ((exp + 12) / 2) * 100;
  return sign > 0 ? 50 + normalized / 2 : 50 - normalized / 2;
}

/**
 * Convert bipolar slider value (0-100) to eccentricity derivative
 * Inverse of eccentricityDragToSlider
 */
export function sliderToEccentricityDrag(slider: number): number {
  if (slider === 50) return 0;
  const isPositive = slider > 50;
  const normalized = isPositive ? (slider - 50) * 2 : (50 - slider) * 2;
  const exp = (normalized / 100) * 2 - 12;
  const value = Math.pow(10, exp);
  return isPositive ? value : -value;
}

/**
 * Format drag rate for display in scientific notation
 */
export function formatDragRate(drag: number): string {
  const exp = Math.round(Math.log10(-drag));
  const mantissa = (-drag / Math.pow(10, exp)).toFixed(1);
  return `${mantissa}×10^${exp}`;
}

/**
 * Format eccentricity derivative for display with sign prefix
 */
export function formatEccentricityRate(drag: number): string {
  if (drag === 0) return '0';
  const sign = drag < 0 ? '-' : '+';
  const absVal = Math.abs(drag);
  const exp = Math.round(Math.log10(absVal));
  const mantissa = (absVal / Math.pow(10, exp)).toFixed(1);
  return `${sign}${mantissa}×10^${exp}`;
}
