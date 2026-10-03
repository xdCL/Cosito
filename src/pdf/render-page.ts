import {
  clip,
  endPath,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
  type PDFDocument,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from 'pdf-lib';
import { APP_CONFIG } from '../config/app';
import type { Layout, Rect, Tile } from '../core/tiling';
import { formatSize, mmToPt } from '../core/units';
import type { PdfOptions } from './types';
const ink = rgb(0.25, 0.25, 0.25);
function line(page: PDFPage, x1: number, y1: number, x2: number, y2: number, thickness = 0.35) {
  page.drawLine({
    start: { x: mmToPt(x1), y: mmToPt(y1) },
    end: { x: mmToPt(x2), y: mmToPt(y2) },
    thickness,
    color: ink,
  });
}
function text(page: PDFPage, font: PDFFont, value: string, x: number, y: number, size = 10) {
  // Standard PDF font supports Latin text; arbitrary filenames may contain other scripts.
  const safe = value.replace(/[^\x20-\x7e\u00a0-\u00ff×]/g, '?');
  page.drawText(safe, { font, size, x: mmToPt(x), y: mmToPt(y), color: ink });
}
export function renderTile(
  doc: PDFDocument,
  image: PDFImage,
  font: PDFFont,
  layout: Layout,
  tile: Tile,
  fitted: Rect,
  options: PdfOptions,
) {
  const page = doc.addPage([mmToPt(layout.paperWidthMm), mmToPt(layout.paperHeightMm)]);
  const r = tile.posterRectMm;
  const p = tile.pageRectMm;
  const bottom = layout.paperHeightMm - p.y - p.height;
  page.pushOperators(
    pushGraphicsState(),
    rectangle(mmToPt(p.x), mmToPt(bottom), mmToPt(p.width), mmToPt(p.height)),
    clip(),
    endPath(),
  );
  page.drawImage(image, {
    x: mmToPt(p.x + fitted.x - r.x),
    y: mmToPt(layout.paperHeightMm - p.y - fitted.y + r.y - fitted.height),
    width: mmToPt(fitted.width),
    height: mmToPt(fitted.height),
  });
  page.pushOperators(popGraphicsState());
  // Keep the outgoing repeated strip. Trim incoming left/top strips.
  // Marks live in discarded margins; no watermark or lines on the final image.
  const left = p.x + tile.overlap.left;
  const right = p.x + p.width;
  const top = layout.paperHeightMm - p.y - tile.overlap.top;
  const length = Math.max(0, Math.min(4, layout.marginMm - 1));
  if (options.cropMarks && length > 0) {
    for (const x of [left, right]) {
      line(page, x, layout.paperHeightMm - p.y + 0.7, x, layout.paperHeightMm - p.y + 0.7 + length);
      line(page, x, bottom - 0.7, x, bottom - 0.7 - length);
    }
    for (const y of [top, bottom]) {
      line(page, p.x - 0.7 - length, y, p.x - 0.7, y);
      if (p.x + p.width + 0.7 + length <= layout.paperWidthMm)
        line(page, p.x + p.width + 0.7, y, p.x + p.width + 0.7 + length, y);
    }
  }
  if (options.alignmentMarks && layout.marginMm >= 3 && layout.overlapMm > 0) {
    // Corresponding ticks mark identical poster coordinates on neighbouring pages.
    const cross = (x: number, y: number) => {
      line(page, x - 0.7, y, x + 0.7, y);
      line(page, x, y - 0.7, x, y + 0.7);
    };
    if (tile.neighbours.left !== undefined) {
      cross(left, layout.paperHeightMm - p.y + 1.5);
      cross(left, bottom - 1.5);
    }
    if (tile.neighbours.right !== undefined) {
      cross(right, layout.paperHeightMm - p.y + 1.5);
      cross(right, bottom - 1.5);
    }
    if (tile.neighbours.top !== undefined) {
      cross(p.x - 1.5, top);
      cross(right + 1.5, top);
    }
    if (tile.neighbours.bottom !== undefined) {
      cross(p.x - 1.5, bottom);
      cross(right + 1.5, bottom);
    }
  }
  if (layout.marginMm >= 3) {
    const joins = [tile.neighbours.right, tile.neighbours.bottom]
      .filter((n): n is number => n !== undefined)
      .map((n) => layout.tiles[n].label)
      .join(', ');
    const label = `${tile.index + 1} / ${layout.sheetCount} · ${tile.label}${joins ? ` · Unir con ${joins}` : ''}`;
    const shortLabel = `${tile.index + 1} / ${layout.sheetCount} · ${tile.label}`;
    const available = mmToPt(layout.paperWidthMm - 2 * layout.marginMm);
    const fittingLabel = font.widthOfTextAtSize(label, 5.5) <= available ? label : shortLabel;
    if (font.widthOfTextAtSize(fittingLabel, 5.5) <= available)
      text(page, font, fittingLabel, layout.marginMm, 1, 5.5);
  }
}
export function renderGuide(doc: PDFDocument, font: PDFFont, layout: Layout, options: PdfOptions) {
  const width = layout.paperWidthMm,
    height = layout.paperHeightMm;
  if (width < 140 || height < 180)
    throw new Error(
      'Para incluir la guía, usa papel de al menos 14 × 18 cm o desactiva esta opción.',
    );
  const page = doc.addPage([mmToPt(width), mmToPt(height)]);
  text(page, font, 'Guía de montaje', 12, height - 20, 20);
  const info = [
    options.filename.slice(0, 60),
    `Tamaño terminado: ${formatSize(layout.posterWidthMm, layout.posterHeightMm)}`,
    `${options.paperName} · ${layout.orientation === 'portrait' ? 'vertical' : 'horizontal'}`,
    `${layout.columns} columnas × ${layout.rows} filas · ${layout.sheetCount} hojas`,
    'Imprime a Tamaño real / 100 %. Desactiva Ajustar a página.',
  ];
  info.forEach((s, i) => text(page, font, s, 12, height - 32 - i * 7));
  const cell = Math.min((width - 24) / layout.columns, (height - 125) / layout.rows, 28);
  for (const tile of layout.tiles) {
    const x = 12 + tile.column * cell,
      y = height - 78 - (tile.row + 1) * cell;
    page.drawRectangle({
      x: mmToPt(x),
      y: mmToPt(y),
      width: mmToPt(cell),
      height: mmToPt(cell),
      borderWidth: 0.35,
      borderColor: ink,
    });
    text(
      page,
      font,
      `${tile.index + 1} · ${tile.label}`,
      x + cell * 0.1,
      y + cell * 0.45,
      Math.min(10, mmToPt(cell) / 6),
    );
  }
  text(page, font, '1. Ordena las hojas por filas: A1, A2…; B1, B2…', 12, 38);
  text(
    page,
    font,
    '2. Recorta los márgenes y las bandas repetidas izquierda y superior.',
    12,
    30,
    9,
  );
  text(
    page,
    font,
    '   Conserva esas bandas en los bordes externos. Alinea y pega por detrás.',
    12,
    24,
    9,
  );
  text(page, font, `Generado con ${APP_CONFIG.name} · ${APP_CONFIG.developer}`, 12, 12, 8);
}
export function renderCalibration(doc: PDFDocument, font: PDFFont, layout: Layout) {
  const width = layout.paperWidthMm,
    height = layout.paperHeightMm;
  if (width < 130 || height < 180)
    throw new Error(
      'Para incluir calibración, usa papel de al menos 13 × 18 cm o desactiva esta opción.',
    );
  const page = doc.addPage([mmToPt(width), mmToPt(height)]);
  text(page, font, 'Comprueba la escala', 15, height - 20, 18);
  text(page, font, 'Imprime al 100 % y mide con una regla.', 15, height - 32, 10);
  line(page, 20, height - 50, 120, height - 50, 0.5);
  line(page, 20, height - 55, 20, height - 155, 0.5);
  for (const x of [20, 120]) line(page, x, height - 52, x, height - 48);
  for (const y of [height - 55, height - 155]) line(page, 18, y, 22, y);
  text(page, font, '100 mm', 55, height - 46);
  text(page, font, '100 mm', 24, height - 155);
  page.drawRectangle({
    x: mmToPt(55),
    y: mmToPt(height - 125),
    width: mmToPt(50),
    height: mmToPt(50),
    borderWidth: 0.5,
    borderColor: ink,
  });
  text(page, font, '50 × 50 mm', 60, height - 135);
}
