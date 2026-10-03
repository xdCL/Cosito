import { LIMITS } from '../config/limits';
export const MAX_POSTER_MM = LIMITS.maxPosterMm;
export const MAX_SHEETS = LIMITS.maxPages;
export function validDimension(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= MAX_POSTER_MM;
}
