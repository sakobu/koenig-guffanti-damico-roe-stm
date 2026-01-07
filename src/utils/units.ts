/**
 * Unit conversion constants and utilities.
 *
 * Internal units: meters (m), meters/second (m/s)
 * Nyx/external units: kilometers (km), km/s
 */

/** Meters to kilometers conversion factor */
export const M_TO_KM = 0.001;

/** Kilometers to meters conversion factor */
export const KM_TO_M = 1000;

/** Meters/second to km/s conversion factor */
export const MS_TO_KMS = 0.001;

/** Km/s to meters/second conversion factor */
export const KMS_TO_MS = 1000;

/** Convert meters to kilometers */
export function mToKm(m: number): number {
  return m * M_TO_KM;
}

/** Convert kilometers to meters */
export function kmToM(km: number): number {
  return km * KM_TO_M;
}

/** Convert m/s to km/s */
export function msToKms(ms: number): number {
  return ms * MS_TO_KMS;
}

/** Convert km/s to m/s */
export function kmsToMs(kms: number): number {
  return kms * KMS_TO_MS;
}
