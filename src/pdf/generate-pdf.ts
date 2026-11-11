import { APP_CONFIG } from '../config/app';
import { orientedSize, placeImage } from '../core/image-fit';
import { planRaster } from '../core/raster-plan';
import { omitTiles } from '../core/mosaic-content';
import { decodeImage, rasterize, validateImage } from '../image/decode-image';
import { blankSheets } from '../image/blank-sheets';
import type { PdfRequest, PdfResult, Progress } from './types';
export function checkCancelled(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Generación cancelada.', 'AbortError');
}
export async function generatePdf(
  request: PdfRequest,
  progress: (p: Progress) => void,
  signal?: AbortSignal,
): Promise<PdfResult> {
  const { file, options } = request;
  const extra = request.kind === 'mosaic' ? Number(options.guide) + Number(options.calibration) : 0;
  let total = request.layout.sheetCount + extra;
  checkCancelled(signal);
  progress({ done: 0, total, message: 'Preparando tu PDF…' });
  // Both dependencies remain outside the initial UI bundle.
  const [
    { PDFDocument, StandardFonts },
    { renderTile, renderGuide, renderCalibration, renderCopies },
  ] = await Promise.all([import('pdf-lib'), import('./render-page')]);
  checkCancelled(signal);
  const meta = await validateImage(file);
  const decoded = await decodeImage(file);
  const fitted = placeImage(
    decoded.width,
    decoded.height,
    request.kind === 'mosaic' ? request.layout.posterWidthMm : request.layout.widthMm,
    request.kind === 'mosaic' ? request.layout.posterHeightMm : request.layout.heightMm,
    options.imageAdjustment,
  );
  const printSize = orientedSize(fitted.width, fitted.height, options.imageAdjustment.rotation);
  let blob: Blob;
  let omitted: number[] = [];
  let blankPiece = false;
  try {
    const raster = planRaster(
      decoded.width,
      decoded.height,
      printSize.width,
      printSize.height,
      options.dpi,
    );
    blob = await rasterize(
      decoded,
      raster.width,
      raster.height,
      meta.type === 'image/jpeg' ? 'image/jpeg' : 'image/png',
      (request.kind === 'mosaic' ? request.skipBlank : !request.cutGuides)
        ? (reader) => {
            const tiles =
              request.kind === 'mosaic'
                ? request.layout.tiles
                : [
                    {
                      index: 0,
                      posterRectMm: {
                        x: 0,
                        y: 0,
                        width: request.layout.widthMm,
                        height: request.layout.heightMm,
                      },
                    },
                  ];
            const blank = blankSheets(
              reader,
              raster.width,
              raster.height,
              tiles,
              fitted,
              options.imageAdjustment.rotation,
            );
            if (request.kind === 'mosaic') omitted = blank;
            else blankPiece = blank.length > 0;
          }
        : undefined,
    );
  } finally {
    decoded.close();
  }
  checkCancelled(signal);
  if (blankPiece)
    throw new Error(
      'La pieza no tiene contenido visible. Revisa el ajuste de la imagen antes de imprimir.',
    );
  if (omitted.length === request.layout.sheetCount)
    throw new Error(
      'El mosaico no tiene contenido visible para imprimir. Puedes conservar las hojas vacías en Opciones avanzadas.',
    );
  const doc = await PDFDocument.create();
  doc.setCreator(`${APP_CONFIG.name} · ${APP_CONFIG.developer}`);
  doc.setTitle(`${APP_CONFIG.name} — ${request.kind === 'mosaic' ? 'mosaico' : 'repeticiones'}`);
  const buffer = await blob.arrayBuffer();
  const image =
    blob.type === 'image/jpeg' ? await doc.embedJpg(buffer) : await doc.embedPng(buffer);
  checkCancelled(signal);
  // A single image XObject, shared by every page. No tile bitmaps.
  if (request.kind === 'mosaic') {
    const layout = omitTiles(request.layout, omitted);
    total = layout.sheetCount + extra;
    const font = await doc.embedFont(StandardFonts.Helvetica);
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
  } else {
    const { layout } = request;
    for (let i = 0; i < layout.sheetCount; i++) {
      checkCancelled(signal);
      renderCopies(
        doc,
        image,
        layout,
        i === layout.sheetCount - 1 ? layout.lastSheetCount : layout.perSheet,
        fitted,
        options.imageAdjustment.rotation,
        request.cutGuides,
      );
      progress({ done: i + 1, total, message: `Preparando hoja ${i + 1} de ${total}…` });
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  checkCancelled(signal);
  const bytes = await doc.save({ objectsPerTick: 25 });
  checkCancelled(signal);
  return { bytes, omitted };
}
