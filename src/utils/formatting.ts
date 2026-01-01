/**
 * Format a number with sign and fixed decimals
 */
export function formatValue(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}`;
}
