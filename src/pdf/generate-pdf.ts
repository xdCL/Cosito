import { APP_CONFIG } from '../config/app';
import { fitImage } from '../core/image-fit';
import { planRaster } from '../core/raster-plan';
import { decodeImage, rasterize, validateImage } from '../image/decode-image';
import type { PdfRequest, Progress } from './types';
export function checkCancelled(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Generación cancelada.', 'AbortError');
}
export async function generatePdf(
  request: PdfRequest,
  progress: (p: Progress) => void,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  const { file, layout, options } = request;
  const total = layout.sheetCount + Number(options.guide) + Number(options.calibration);
  checkCancelled(signal);
  progress({ done: 0, total, message: 'Preparando tu PDF…' });
  // Both dependencies remain outside the initial UI bundle.
  const [{ PDFDocument, StandardFonts }, { renderTile, renderGuide, renderCalibration }] =
    await Promise.all([import('pdf-lib'), import('./render-page')]);
  checkCancelled(signal);
  const meta = await validateImage(file);
  const decoded = await decodeImage(file);
  const fitted = fitImage(
    decoded.width,
    decoded.height,
    layout.posterWidthMm,
    layout.posterHeightMm,
    options.fit,
  );
  let blob: Blob;
  try {
    const raster = planRaster(
      decoded.width,
      decoded.height,
      fitted.width,
      fitted.height,
      options.dpi,
    );
    blob = await rasterize(
      decoded,
      raster.width,
      raster.height,
      meta.type === 'image/jpeg' ? 'image/jpeg' : 'image/png',
    );
  } finally {
    decoded.close();
  }
  checkCancelled(signal);
  const doc = await PDFDocument.create();
  doc.setCreator(`${APP_CONFIG.name} · ${APP_CONFIG.developer}`);
  doc.setTitle(`${APP_CONFIG.name} — mosaico`);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const buffer = await blob.arrayBuffer();
  const image =
    blob.type === 'image/jpeg' ? await doc.embedJpg(buffer) : await doc.embedPng(buffer);
  checkCancelled(signal);
  // A single image XObject, shared by every page. No tile bitmaps.
  for (const tile of layout.tiles) {
    checkCancelled(signal);
    renderTile(doc, image, font, layout, tile, fitted, options);
    progress({
      done: tile.index + 1,
      total,
      message: `Preparando hoja ${tile.index + 1} de ${layout.sheetCount}…`,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  if (options.guide) {
    checkCancelled(signal);
    renderGuide(doc, font, layout, options);
    progress({ done: layout.sheetCount + 1, total, message: 'Preparando guía de montaje…' });
  }
  if (options.calibration) {
    checkCancelled(signal);
    renderCalibration(doc, font, layout);
    progress({ done: total, total, message: 'Preparando calibración…' });
  }
  checkCancelled(signal);
  const bytes = await doc.save({ objectsPerTick: 25 });
  checkCancelled(signal);
  return bytes;
}
