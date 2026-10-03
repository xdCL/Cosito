/** Bounds for modest devices. No full-poster raster is ever allocated. */
export const LIMITS = {
  maxPosterMm: 100_000,
  maxPages: 100,
  maxFileBytes: 30 * 1024 * 1024,
  maxSourcePixels: 24_000_000,
  maxSourceSide: 16_384,
  maxPreviewSide: 1200,
  maxRasterPixels: 12_000_000,
  maxRasterSide: 4096,
  warningPages: 40,
} as const;
