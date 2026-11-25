import { calculateLayout, type Layout, type LayoutInput } from './tiling';
import { MAX_SHEETS, validDimension } from './validation';

export function sheetDistributions(count: number): { columns: number; rows: number }[] {
  if (!Number.isInteger(count) || count < 1 || count > MAX_SHEETS) return [];
  return Array.from({ length: count }, (_, i) => i + 1)
    .filter((columns) => count % columns === 0)
    .map((columns) => ({ columns, rows: count / columns }));
}

type SheetLayoutInput = Omit<LayoutInput, 'posterWidthMm' | 'posterHeightMm'> & {
  sheetCount: number;
  columns?: number;
  imageAspect: number;
};

/** Use the complete printable grid, including overlap, without rounding centimetres. */
export function calculateSheetLayout(input: SheetLayoutInput): Layout {
  const distributions = sheetDistributions(input.sheetCount);
  if (!distributions.length)
    throw new Error(`Ingresa una cantidad entera entre 1 y ${MAX_SHEETS} hojas.`);
  const grids =
    input.columns === undefined
      ? distributions
      : distributions.filter((grid) => grid.columns === input.columns);
  if (!grids.length)
    throw new Error('Selecciona una distribución válida para esta cantidad de hojas.');
  if (![input.paperWidthMm, input.paperHeightMm].every(validDimension))
    throw new Error('Ingresa medidas de papel mayores que cero y de hasta 10.000 cm.');
  if (!Number.isFinite(input.imageAspect) || input.imageAspect <= 0)
    throw new Error('La imagen debe tener una proporción válida.');
  if (!['auto', 'portrait', 'landscape'].includes(input.orientation))
    throw new Error('Selecciona una orientación válida.');
  if (![input.marginMm, input.overlapMm].every((value) => Number.isFinite(value) && value >= 0))
    throw new Error('El margen y el solape deben ser números mayores o iguales a cero.');
  if (Math.min(input.paperWidthMm, input.paperHeightMm) - 2 * input.marginMm <= input.overlapMm)
    throw new Error('El margen y el solape dejan muy poco espacio imprimible.');
  const orientations =
    input.orientation === 'auto' ? (['portrait', 'landscape'] as const) : [input.orientation];
  const candidates: Layout[] = [];
  for (const orientation of orientations) {
    const short = Math.min(input.paperWidthMm, input.paperHeightMm);
    const long = Math.max(input.paperWidthMm, input.paperHeightMm);
    const width = (orientation === 'portrait' ? short : long) - 2 * input.marginMm;
    const height = (orientation === 'portrait' ? long : short) - 2 * input.marginMm;
    for (const grid of grids) {
      candidates.push(
        calculateLayout({
          paperWidthMm: input.paperWidthMm,
          paperHeightMm: input.paperHeightMm,
          marginMm: input.marginMm,
          overlapMm: input.overlapMm,
          orientation,
          posterWidthMm: width + (grid.columns - 1) * (width - input.overlapMm),
          posterHeightMm: height + (grid.rows - 1) * (height - input.overlapMm),
        }),
      );
    }
  }
  const mismatch = (layout: Layout) =>
    Math.abs(Math.log(layout.posterWidthMm / layout.posterHeightMm / input.imageAspect));
  candidates.sort((a, b) => mismatch(a) - mismatch(b) || a.seams - b.seams);
  return candidates[0];
}
