import { PDFDocument, type PDFImage } from 'pdf-lib';
import { APP_CONFIG } from '../config/app';
import { orientedSize, placeImage, type ImageRotation } from '../core/image-fit';
import { planRaster } from '../core/raster-plan';
import { decodeImage, rasterize, validateImage } from '../image/decode-image';
import { renderMixedCopies } from './render-page';
import type { PdfRequest, PdfResult, Progress } from './types';

/** Every uploaded artwork is embedded once and assigned to exactly one printed slot. */
export async function generateMultiImagePdf(
  request: Extract<PdfRequest, { kind: 'repeat' }>,
  progress: (value: Progress) => void,
  signal?: AbortSignal,
): Promise<PdfResult> {
  const pieces = request.pieces ?? [];
  const { layout, options } = request;
  if (!pieces.length || pieces.length !== layout.copies)
    throw new Error('La cantidad de imágenes debe coincidir con las credenciales del PDF.');
  const check = () => {
    if (signal?.aborted) throw new DOMException('Generación cancelada.', 'AbortError');
  };
  check();
  const doc = await PDFDocument.create();
  doc.setCreator(APP_CONFIG.name + ' · ' + APP_CONFIG.developer);
  doc.setTitle(APP_CONFIG.name + ' — credenciales diferentes');
  const total = pieces.length + layout.sheetCount;
  const prepared: { image: PDFImage; fitted: ReturnType<typeof placeImage>; rotation: ImageRotation }[] = [];
  for (let i = 0; i < pieces.length; i++) {
    check();
    const { file, adjustment } = pieces[i];
    const metadata = await validateImage(file);
    const decoded = await decodeImage(file);
    let blob: Blob;
    const fitted = placeImage(decoded.width, decoded.height, layout.widthMm, layout.heightMm, adjustment);
    const oriented = orientedSize(fitted.width, fitted.height, adjustment.rotation);
    const raster = planRaster(decoded.width, decoded.height, oriented.width, oriented.height, options.dpi);
    try {
      blob = await rasterize(
        decoded,
        raster.width,
        raster.height,
        metadata.type === 'image/jpeg' ? 'image/jpeg' : 'image/png',
      );
    } finally {
      decoded.close();
    }
    check();
    const buffer = await blob.arrayBuffer();
    const image = blob.type === 'image/jpeg' ? await doc.embedJpg(buffer) : await doc.embedPng(buffer);
    prepared.push({ image, fitted, rotation: adjustment.rotation });
    progress({ done: i + 1, total, message: 'Preparando imagen ' + (i + 1) + ' de ' + pieces.length + '…' });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  for (let i = 0; i < layout.sheetCount; i++) {
    check();
    renderMixedCopies(
      doc,
      layout,
      prepared.slice(i * layout.perSheet, (i + 1) * layout.perSheet),
      request.cutGuides,
    );
    progress({
      done: pieces.length + i + 1,
      total,
      message: 'Preparando hoja ' + (i + 1) + ' de ' + layout.sheetCount + '…',
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  check();
  const bytes = await doc.save({ objectsPerTick: 25 });
  check();
  return { bytes, omitted: [] };
}
