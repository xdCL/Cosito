import { LIMITS } from '../config/limits';
import { imageMetadata } from './metadata';
export type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};
export async function validateImage(file: Blob) {
  if (!file.size || file.size > LIMITS.maxFileBytes)
    throw new Error('Selecciona una imagen de hasta 30 MB.');
  // JPEG metadata can appear after a large EXIF block. Never read the whole file here.
  const meta = imageMetadata(new Uint8Array(await file.slice(0, 512 * 1024).arrayBuffer()));
  if (
    meta.width <= 0 ||
    meta.height <= 0 ||
    meta.width * meta.height > LIMITS.maxSourcePixels ||
    Math.max(meta.width, meta.height) > LIMITS.maxSourceSide
  )
    throw new Error(
      'Esta imagen es demasiado grande. Reduce su resolución a 24 millones de píxeles o menos.',
    );
  return meta;
}
export async function decodeImage(file: Blob): Promise<DecodedImage> {
  await validateImage(file);
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      /* Some browsers decode particular formats only via HTMLImageElement. */
    }
  }
  if (typeof Image === 'undefined')
    throw new Error('No pudimos abrir esta imagen en este navegador.');
  const url = URL.createObjectURL(file);
  const img = new Image();
  try {
    img.src = url;
    await img.decode();
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => {
        img.src = '';
        URL.revokeObjectURL(url);
      },
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error('No pudimos abrir esta imagen. Prueba con JPG, PNG o WEBP.');
  }
}
export function canvasBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No pudimos preparar la imagen.'))),
      type,
      0.94,
    ),
  );
}
export async function rasterize(
  image: DecodedImage,
  width: number,
  height: number,
  type: string,
): Promise<Blob> {
  if (typeof OffscreenCanvas === 'function') {
    const canvas = new OffscreenCanvas(width, height);
    try {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Este navegador no permite preparar la imagen.');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image.source, 0, 0, width, height);
      return await canvas.convertToBlob({ type, quality: 0.94 });
    } catch {
      if (typeof document === 'undefined')
        throw new Error('No pudimos preparar la imagen en este navegador.');
      // A partial implementation of OffscreenCanvas must not block the HTML fallback.
    } finally {
      canvas.width = 1;
      canvas.height = 1;
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  try {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Este navegador no permite preparar la imagen.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image.source, 0, 0, width, height);
    return await canvasBlob(canvas, type);
  } finally {
    canvas.width = 1;
    canvas.height = 1;
  }
}
export type LoadedImage = { file: File; width: number; height: number; previewUrl: string };
export async function loadImage(file: File): Promise<LoadedImage> {
  const decoded = await decodeImage(file);
  try {
    const scale = Math.min(1, LIMITS.maxPreviewSide / Math.max(decoded.width, decoded.height));
    const preview = await rasterize(
      decoded,
      Math.max(1, Math.round(decoded.width * scale)),
      Math.max(1, Math.round(decoded.height * scale)),
      'image/png',
    );
    return {
      file,
      width: decoded.width,
      height: decoded.height,
      previewUrl: URL.createObjectURL(preview),
    };
  } finally {
    decoded.close();
  }
}
