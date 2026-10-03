import { MAX_SHEETS, validDimension } from './validation';
export type Orientation = 'auto' | 'portrait' | 'landscape';
export type Rect = { x: number; y: number; width: number; height: number };
export type LayoutInput = {
  posterWidthMm: number;
  posterHeightMm: number;
  paperWidthMm: number;
  paperHeightMm: number;
  marginMm: number;
  overlapMm: number;
  orientation: Orientation;
};
export type Tile = {
  index: number;
  column: number;
  row: number;
  label: string;
  posterRectMm: Rect;
  pageRectMm: Rect;
  overlap: { left: number; top: number; right: number; bottom: number };
  neighbours: { left?: number; top?: number; right?: number; bottom?: number };
};
export type Layout = LayoutInput & {
  orientation: Exclude<Orientation, 'auto'>;
  columns: number;
  rows: number;
  sheetCount: number;
  printableWidthMm: number;
  printableHeightMm: number;
  coverageWidthMm: number;
  coverageHeightMm: number;
  wasteAreaMm2: number;
  seams: number;
  alternativeSheetCount?: number;
  tiles: readonly Tile[];
};
export function rowLabel(row: number): string {
  let label = '';
  for (let n = row + 1; n > 0; n = Math.floor((n - 1) / 26))
    label = String.fromCharCode(65 + ((n - 1) % 26)) + label;
  return label;
}
// Absolute tolerance of 1e-7 mm prevents extra sheets at floating-point boundaries.
export function pagesFor(target: number, usable: number, overlap: number): number {
  return target <= usable + 1e-7 ? 1 : 1 + Math.ceil((target - usable - 1e-7) / (usable - overlap));
}
function orientedLayout(input: LayoutInput, orientation: Layout['orientation']): Layout {
  const short = Math.min(input.paperWidthMm, input.paperHeightMm);
  const long = Math.max(input.paperWidthMm, input.paperHeightMm);
  const paperWidthMm = orientation === 'portrait' ? short : long;
  const paperHeightMm = orientation === 'portrait' ? long : short;
  const printableWidthMm = paperWidthMm - 2 * input.marginMm;
  const printableHeightMm = paperHeightMm - 2 * input.marginMm;
  if (printableWidthMm <= input.overlapMm || printableHeightMm <= input.overlapMm)
    throw new Error('El margen y el solape dejan muy poco espacio imprimible.');
  const columns = pagesFor(input.posterWidthMm, printableWidthMm, input.overlapMm);
  const rows = pagesFor(input.posterHeightMm, printableHeightMm, input.overlapMm);
  const sheetCount = columns * rows;
  const coverageWidthMm = printableWidthMm + (columns - 1) * (printableWidthMm - input.overlapMm);
  const coverageHeightMm = printableHeightMm + (rows - 1) * (printableHeightMm - input.overlapMm);
  return {
    ...input,
    paperWidthMm,
    paperHeightMm,
    orientation,
    printableWidthMm,
    printableHeightMm,
    columns,
    rows,
    sheetCount,
    coverageWidthMm,
    coverageHeightMm,
    wasteAreaMm2: coverageWidthMm * coverageHeightMm - input.posterWidthMm * input.posterHeightMm,
    seams: (columns - 1) * rows + (rows - 1) * columns,
    tiles: [],
  };
}
export function calculateLayout(input: LayoutInput): Layout {
  if (
    ![input.posterWidthMm, input.posterHeightMm, input.paperWidthMm, input.paperHeightMm].every(
      validDimension,
    )
  )
    throw new Error('Ingresa medidas mayores que cero y de hasta 10.000 cm.');
  if (
    !Number.isFinite(input.marginMm) ||
    input.marginMm < 0 ||
    !Number.isFinite(input.overlapMm) ||
    input.overlapMm < 0
  )
    throw new Error('El margen y el solape deben ser números mayores o iguales a cero.');
  if (!['auto', 'portrait', 'landscape'].includes(input.orientation))
    throw new Error('Selecciona una orientación válida.');
  let layout: Layout;
  if (input.orientation === 'auto') {
    const candidates = [orientedLayout(input, 'portrait'), orientedLayout(input, 'landscape')];
    candidates.sort(
      (a, b) => a.sheetCount - b.sheetCount || a.wasteAreaMm2 - b.wasteAreaMm2 || a.seams - b.seams,
    );
    layout = { ...candidates[0], alternativeSheetCount: candidates[1].sheetCount };
  } else layout = orientedLayout(input, input.orientation);
  if (layout.sheetCount > MAX_SHEETS)
    throw new Error(
      `Este mosaico supera el límite de ${MAX_SHEETS} hojas. Reduce el tamaño o usa un papel mayor.`,
    );
  const tiles: Tile[] = [];
  for (let row = 0; row < layout.rows; row++) {
    for (let column = 0; column < layout.columns; column++) {
      const index = row * layout.columns + column;
      const x = column * (layout.printableWidthMm - input.overlapMm);
      const y = row * (layout.printableHeightMm - input.overlapMm);
      const width = Math.min(layout.printableWidthMm, input.posterWidthMm - x);
      const height = Math.min(layout.printableHeightMm, input.posterHeightMm - y);
      tiles.push({
        row,
        column,
        index,
        label: `${rowLabel(row)}${column + 1}`,
        posterRectMm: { x, y, width, height },
        pageRectMm: { x: input.marginMm, y: input.marginMm, width, height },
        overlap: {
          left: column ? input.overlapMm : 0,
          top: row ? input.overlapMm : 0,
          right: column < layout.columns - 1 ? input.overlapMm : 0,
          bottom: row < layout.rows - 1 ? input.overlapMm : 0,
        },
        neighbours: {
          left: column ? index - 1 : undefined,
          right: column < layout.columns - 1 ? index + 1 : undefined,
          top: row ? index - layout.columns : undefined,
          bottom: row < layout.rows - 1 ? index + layout.columns : undefined,
        },
      });
    }
  }
  return { ...layout, tiles };
}
