import { LIMITS } from '../config/limits';
import type { ImageRotation } from './image-fit';
import type { Layout, Orientation, Rect } from './tiling';
import { validDimension } from './validation';

type Run = { kind: 'sheets'; count: number } | { kind: 'copies'; count: number };
export type RepeatInput = {
  widthMm: number;
  heightMm: number;
  paperWidthMm: number;
  paperHeightMm: number;
  marginMm: number;
  gapMm: number;
  orientation: Orientation;
  allowRotation: boolean;
  perSheet?: number;
  run: Run;
};
export type RepeatLayout = {
  paperWidthMm: number;
  paperHeightMm: number;
  orientation: Layout['orientation'];
  widthMm: number;
  heightMm: number;
  rotated: boolean;
  capacity: number;
  perSheet: number;
  copies: number;
  sheetCount: number;
  lastSheetCount: number;
  slots: Rect[];
};

export function calculateRepetition(input: RepeatInput): RepeatLayout {
  if (![input.widthMm, input.heightMm].every((v) => validDimension(v) && v >= 1))
    throw new Error('Cada lado de la pieza debe medir al menos 1 mm.');
  if (![input.paperWidthMm, input.paperHeightMm].every(validDimension))
    throw new Error('Revisa las medidas del papel.');
  if (![input.marginMm, input.gapMm].every((v) => v === 0 || validDimension(v)))
    throw new Error('Revisa el margen y la separación entre piezas.');
  if (!Number.isSafeInteger(input.run.count) || input.run.count < 1)
    throw new Error('Ingresa una cantidad entera mayor que cero.');
  if (input.perSheet !== undefined && (!Number.isSafeInteger(input.perSheet) || input.perSheet < 1))
    throw new Error('Las copias por hoja deben ser un número entero mayor que cero.');

  const short = Math.min(input.paperWidthMm, input.paperHeightMm);
  const long = Math.max(input.paperWidthMm, input.paperHeightMm);
  const orientations: Layout['orientation'][] =
    input.orientation === 'auto' ? ['portrait', 'landscape'] : [input.orientation];
  const candidates = orientations.flatMap((orientation) => {
    const paperWidthMm = orientation === 'portrait' ? short : long;
    const paperHeightMm = orientation === 'portrait' ? long : short;
    return (input.allowRotation ? [false, true] : [false]).map((rotated) => {
      const width = rotated ? input.heightMm : input.widthMm;
      const height = rotated ? input.widthMm : input.heightMm;
      const fit = (paper: number, piece: number) =>
        Math.max(
          0,
          Math.floor((paper - 2 * input.marginMm + input.gapMm + 1e-7) / (piece + input.gapMm)),
        );
      const columns = fit(paperWidthMm, width);
      const rows = fit(paperHeightMm, height);
      return {
        paperWidthMm,
        paperHeightMm,
        orientation,
        rotated,
        width,
        height,
        columns,
        capacity: columns * rows,
      };
    });
  });
  candidates.sort((a, b) => b.capacity - a.capacity || Number(a.rotated) - Number(b.rotated));
  const best = candidates[0];
  const capacity = Math.min(best.capacity, LIMITS.maxCopiesPerSheet);
  if (!capacity) throw new Error('La pieza no cabe en el papel con ese margen.');
  const perSheet = input.perSheet ?? capacity;
  if (perSheet > capacity)
    throw new Error(`Caben hasta ${capacity} copias por hoja con estas medidas.`);
  const copies = input.run.kind === 'sheets' ? input.run.count * perSheet : input.run.count;
  const sheetCount = Math.ceil(copies / perSheet);
  if (sheetCount > LIMITS.maxPages || copies > LIMITS.maxCopies)
    throw new Error(`El PDF admite hasta ${LIMITS.maxPages} hojas y ${LIMITS.maxCopies} copias.`);

  const slotsOnFullSheet = Math.min(perSheet, copies);
  const columns = Math.min(best.columns, slotsOnFullSheet);
  const rows = Math.ceil(slotsOnFullSheet / columns);
  const x = (best.paperWidthMm - columns * best.width - (columns - 1) * input.gapMm) / 2;
  const y = (best.paperHeightMm - rows * best.height - (rows - 1) * input.gapMm) / 2;
  return {
    paperWidthMm: best.paperWidthMm,
    paperHeightMm: best.paperHeightMm,
    orientation: best.orientation,
    widthMm: input.widthMm,
    heightMm: input.heightMm,
    rotated: best.rotated,
    capacity,
    perSheet,
    copies,
    sheetCount,
    lastSheetCount: copies - (sheetCount - 1) * perSheet,
    slots: Array.from({ length: slotsOnFullSheet }, (_, i) => ({
      x: x + (i % columns) * (best.width + input.gapMm),
      y: y + Math.floor(i / columns) * (best.height + input.gapMm),
      width: best.width,
      height: best.height,
    })),
  };
}

/** Place the already fitted artwork in a slot, including any turn of the whole piece. */
export function placeCopy(layout: RepeatLayout, slot: Rect, fitted: Rect, rotation: ImageRotation) {
  return layout.rotated
    ? {
        rect: {
          x: slot.x + layout.heightMm - fitted.y - fitted.height,
          y: slot.y + fitted.x,
          width: fitted.height,
          height: fitted.width,
        },
        rotation: ((rotation + 90) % 360) as ImageRotation,
      }
    : {
        rect: { ...fitted, x: slot.x + fitted.x, y: slot.y + fitted.y },
        rotation,
      };
}
