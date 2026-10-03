export type ImageFit = 'contain' | 'cover' | 'stretch';
export function fitImage(
  imageWidth: number,
  imageHeight: number,
  targetWidth: number,
  targetHeight: number,
  fit: ImageFit,
) {
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
  return { x: (targetWidth - width) / 2, y: (targetHeight - height) / 2, width, height };
}
