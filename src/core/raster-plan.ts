import { LIMITS } from '../config/limits';
import { mmToPx } from './units';
/** A source-image raster plan; never dimensions of the whole poster canvas. */
export function planRaster(
  width: number,
  height: number,
  fittedWidthMm: number,
  fittedHeightMm: number,
  dpi: number,
) {
  if (
    ![width, height, fittedWidthMm, fittedHeightMm, dpi].every((n) => Number.isFinite(n) && n > 0)
  )
    throw new Error('La imagen y la calidad deben tener medidas válidas.');
  const requested = Math.min(
    1,
    mmToPx(fittedWidthMm, dpi) / width,
    mmToPx(fittedHeightMm, dpi) / height,
  );
  const scale = Math.min(
    requested,
    LIMITS.maxRasterSide / Math.max(width, height),
    Math.sqrt(LIMITS.maxRasterPixels / (width * height)),
  );
  const rasterWidth = Math.max(1, Math.floor(width * scale));
  const rasterHeight = Math.max(1, Math.floor(height * scale));
  return {
    width: rasterWidth,
    height: rasterHeight,
    capped: scale < requested,
    effectivePpi: Math.min(
      (rasterWidth * 25.4) / fittedWidthMm,
      (rasterHeight * 25.4) / fittedHeightMm,
    ),
  };
}
