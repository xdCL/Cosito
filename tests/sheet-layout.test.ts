import { describe, expect, it } from 'vitest';
import { calculateSheetLayout, sheetDistributions } from '../src/core/sheet-layout';
import type { Orientation } from '../src/core/tiling';

const base = {
  sheetCount: 6,
  paperWidthMm: 215.9,
  paperHeightMm: 279.4,
  marginMm: 5,
  overlapMm: 5,
  orientation: 'portrait' as Orientation,
  imageAspect: 2 / 3,
};

describe('mosaico por cantidad exacta de hojas', () => {
  it('ofrece todas las distribuciones exactas, incluidos números primos y una hoja', () => {
    expect(sheetDistributions(6)).toEqual([
      { columns: 1, rows: 6 },
      { columns: 2, rows: 3 },
      { columns: 3, rows: 2 },
      { columns: 6, rows: 1 },
    ]);
    expect(sheetDistributions(7)).toEqual([
      { columns: 1, rows: 7 },
      { columns: 7, rows: 1 },
    ]);
    expect(sheetDistributions(1)).toEqual([{ columns: 1, rows: 1 }]);
    for (const count of [0, -1, 1.5, 101, NaN, Infinity])
      expect(sheetDistributions(count)).toEqual([]);
  });

  it('calcula el tamaño físico de 2 × 3 y 3 × 2 con margen y solape', () => {
    const vertical = calculateSheetLayout({ ...base, columns: 2 });
    expect(vertical.posterWidthMm).toBeCloseTo(406.8, 8);
    expect(vertical.posterHeightMm).toBeCloseTo(798.2, 8);
    const horizontal = calculateSheetLayout({ ...base, columns: 3 });
    expect(horizontal.posterWidthMm).toBeCloseTo(607.7, 8);
    expect(horizontal.posterHeightMm).toBeCloseTo(533.8, 8);
  });

  it('conserva cada distribución para 1 a 100 hojas, en ambas orientaciones y varios papeles', () => {
    for (const [paperWidthMm, paperHeightMm] of [
      [215.9, 279.4],
      [210, 297],
      [216, 330],
      [216, 356],
      [123.45, 234.56],
    ]) {
      for (const orientation of ['portrait', 'landscape'] as const) {
        for (let sheetCount = 1; sheetCount <= 100; sheetCount++) {
          for (const { columns, rows } of sheetDistributions(sheetCount)) {
            const layout = calculateSheetLayout({
              ...base,
              paperWidthMm,
              paperHeightMm,
              sheetCount,
              columns,
              orientation,
            });
            expect(layout.sheetCount).toBe(sheetCount);
            expect(layout.columns).toBe(columns);
            expect(layout.rows).toBe(rows);
            expect(layout.tiles).toHaveLength(sheetCount);
            const last = layout.tiles.at(-1)!.posterRectMm;
            expect(last.x + last.width).toBeCloseTo(layout.posterWidthMm, 7);
            expect(last.y + last.height).toBeCloseTo(layout.posterHeightMm, 7);
            expect(last.width).toBeCloseTo(layout.printableWidthMm, 7);
            expect(last.height).toBeCloseTo(layout.printableHeightMm, 7);
          }
        }
      }
    }
  });

  it('recomienda la distribución que mejor conserva la proporción de la imagen', () => {
    for (const orientation of ['auto', 'portrait', 'landscape'] as const) {
      for (const imageAspect of [0.05, 0.5, 1, 2, 20]) {
        const best = calculateSheetLayout({ ...base, orientation, imageAspect });
        const mismatch = (width: number, height: number) =>
          Math.abs(Math.log(width / height / imageAspect));
        for (const { columns } of sheetDistributions(6)) {
          const alternative = calculateSheetLayout({ ...base, orientation, imageAspect, columns });
          expect(mismatch(best.posterWidthMm, best.posterHeightMm)).toBeLessThanOrEqual(
            mismatch(alternative.posterWidthMm, alternative.posterHeightMm) + 1e-10,
          );
        }
      }
    }
  });

  it('actualiza medidas con el papel, margen y solape, conservando seis hojas', () => {
    for (const marginMm of [0, 3, 10]) {
      for (const overlapMm of [0, 3, 10]) {
        const layout = calculateSheetLayout({
          ...base,
          columns: 2,
          paperWidthMm: 210,
          paperHeightMm: 297,
          marginMm,
          overlapMm,
        });
        expect(layout.posterWidthMm).toBeCloseTo(2 * (210 - 2 * marginMm) - overlapMm, 8);
        expect(layout.posterHeightMm).toBeCloseTo(3 * (297 - 2 * marginMm) - 2 * overlapMm, 8);
        expect(layout.sheetCount).toBe(6);
      }
    }
  });

  it('rechaza cantidades, distribuciones, papel y opciones inválidas', () => {
    for (const sheetCount of [0, -1, 101, 2.5, NaN, Infinity])
      expect(() => calculateSheetLayout({ ...base, sheetCount })).toThrow('cantidad entera');
    for (const columns of [0, 4, 1.5, NaN])
      expect(() => calculateSheetLayout({ ...base, columns })).toThrow('distribución válida');
    for (const marginMm of [-1, NaN, Infinity, 106])
      expect(() => calculateSheetLayout({ ...base, marginMm })).toThrow();
    for (const overlapMm of [-1, NaN, Infinity, 206])
      expect(() => calculateSheetLayout({ ...base, overlapMm })).toThrow();
    for (const paperWidthMm of [0, -1, NaN, Infinity, 100001])
      expect(() => calculateSheetLayout({ ...base, paperWidthMm })).toThrow();
    expect(() => calculateSheetLayout({ ...base, imageAspect: 0 })).toThrow();
  });
});
