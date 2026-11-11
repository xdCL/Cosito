import type { Rect } from './tiling';

export type ImageFit = 'contain' | 'cover' | 'stretch';
export type ImageRotation = 0 | 90 | 180 | 270;
export type ImageAlignment = 'start' | 'center' | 'end';
export type ImageAdjustment = {
  fit: ImageFit;
  rotation: ImageRotation;
  alignX: ImageAlignment;
  alignY: ImageAlignment;
};
export const DEFAULT_IMAGE_ADJUSTMENT: ImageAdjustment = {
  fit: 'contain',
  rotation: 0,
  alignX: 'center',
  alignY: 'center',
};
const anchor: Record<ImageAlignment, number> = { start: 0, center: 0.5, end: 1 };

export function orientedSize(width: number, height: number, rotation: ImageRotation) {
  return rotation === 90 || rotation === 270 ? { width: height, height: width } : { width, height };
}

export function fitImage(
  imageWidth: number,
  imageHeight: number,
  targetWidth: number,
  targetHeight: number,
  fit: ImageFit,
  alignX: ImageAlignment = 'center',
  alignY: ImageAlignment = 'center',
): Rect {
  if (
    ![imageWidth, imageHeight, targetWidth, targetHeight].every((n) => Number.isFinite(n) && n > 0)
  )
    throw new Error('La imagen y el tamaño deben tener medidas válidas.');
  if (!['contain', 'cover', 'stretch'].includes(fit))
    throw new Error('Selecciona un ajuste válido.');
  if (fit === 'stretch') return { x: 0, y: 0, width: targetWidth, height: targetHeight };
  const ratios = [targetWidth / imageWidth, targetHeight / imageHeight];
  const scale = fit === 'cover' ? Math.max(...ratios) : Math.min(...ratios);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    x: (targetWidth - width) * anchor[alignX],
    y: (targetHeight - height) * anchor[alignY],
    width,
    height,
  };
}

export function placeImage(
  imageWidth: number,
  imageHeight: number,
  posterWidth: number,
  posterHeight: number,
  adjustment: ImageAdjustment,
) {
  const { rotation, fit, alignX, alignY } = adjustment;
  const size = orientedSize(imageWidth, imageHeight, rotation);
  return fitImage(size.width, size.height, posterWidth, posterHeight, fit, alignX, alignY);
}

/** Map the source unit square (top-left origin) onto the fitted poster rectangle. */
export function imageTransform(
  { x, y, width: w, height: h }: Rect,
  rotation: ImageRotation,
): [number, number, number, number, number, number] {
  switch (rotation) {
    case 90:
      return [0, h, -w, 0, x + w, y];
    case 180:
      return [-w, 0, 0, -h, x + w, y + h];
    case 270:
      return [0, -h, w, 0, x, y + h];
    default:
      return [w, 0, 0, h, x, y];
  }
}
