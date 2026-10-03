import { describe, it, expect } from 'vitest';
import { calculateLayout, rowLabel } from '../src/core/tiling';
import { cmToMm, mmToCm, mmToPt, ptToMm, inToMm, mmToIn, mmToPx } from '../src/core/units';
import { fitImage } from '../src/core/image-fit';
import { PAPERS } from '../src/config/papers';
const base = {
  posterWidthMm: 500,
  posterHeightMm: 980,
  paperWidthMm: 215.9,
  paperHeightMm: 279.4,
  marginMm: 5,
  overlapMm: 5,
  orientation: 'auto' as const,
};
describe('unidades físicas (tolerancia 1e-8)', () => {
  it('convierte sin pérdida significativa', () => {
    for (const mm of [0, 5, 215.9, 1000]) {
      expect(cmToMm(mmToCm(mm))).toBeCloseTo(mm, 8);
      expect(ptToMm(mmToPt(mm))).toBeCloseTo(mm, 8);
      expect(inToMm(mmToIn(mm))).toBeCloseTo(mm, 8);
    }
    expect(mmToPt(215.9)).toBeCloseTo(612, 8);
    expect(mmToPx(25.4, 200)).toBe(200);
  });
});
describe('motor de mosaico', () => {
  it('50 × 98 cm: 10 hojas, 2 columnas × 5 filas horizontales', () => {
    expect(calculateLayout(base)).toMatchObject({
      columns: 2,
      rows: 5,
      sheetCount: 10,
      orientation: 'landscape',
    });
    expect(calculateLayout({ ...base, orientation: 'portrait' }).sheetCount).toBe(12);
  });
  it('29 × 35 cm: 4 hojas', () =>
    expect(calculateLayout({ ...base, posterWidthMm: 290, posterHeightMm: 350 }).sheetCount).toBe(
      4,
    ));
  it('una hoja, márgenes cero y límite flotante', () => {
    expect(
      calculateLayout({
        ...base,
        posterWidthMm: 279.4,
        posterHeightMm: 215.9,
        marginMm: 0,
        overlapMm: 0,
      }).sheetCount,
    ).toBe(1);
    expect(
      calculateLayout({ ...base, posterWidthMm: 269.4 + 1e-10, posterHeightMm: 205.9 }).sheetCount,
    ).toBe(1);
    expect(calculateLayout({ ...base, posterWidthMm: 10, posterHeightMm: 10 }).sheetCount).toBe(1);
  });
  it('cobertura sin huecos, solapes exactos y último borde recortado', () => {
    for (const [w, h] of [
      [290, 350],
      [500, 980],
      [297, 210],
      [500, 700],
      [1000, 700],
      [2000, 1000],
      [350, 290],
    ]) {
      for (const paper of [...PAPERS, { widthMm: 190, heightMm: 310 }]) {
        for (const marginMm of [0, 5])
          for (const overlapMm of [0, 5]) {
            const layout = calculateLayout({
              ...base,
              posterWidthMm: w,
              posterHeightMm: h,
              paperWidthMm: paper.widthMm,
              paperHeightMm: paper.heightMm,
              marginMm,
              overlapMm,
            });
            expect(layout.coverageWidthMm + 1e-7).toBeGreaterThanOrEqual(w);
            expect(layout.coverageHeightMm + 1e-7).toBeGreaterThanOrEqual(h);
            for (const tile of layout.tiles) {
              const r = tile.posterRectMm;
              expect(r.x).toBeGreaterThanOrEqual(0);
              expect(r.y).toBeGreaterThanOrEqual(0);
              expect(r.x + r.width).toBeLessThanOrEqual(w + 1e-7);
              expect(r.y + r.height).toBeLessThanOrEqual(h + 1e-7);
              if (tile.neighbours.right !== undefined)
                expect(
                  r.x + r.width - layout.tiles[tile.neighbours.right].posterRectMm.x,
                ).toBeCloseTo(overlapMm, 7);
              else expect(r.x + r.width).toBeCloseTo(w, 7);
              if (tile.neighbours.bottom !== undefined)
                expect(
                  r.y + r.height - layout.tiles[tile.neighbours.bottom].posterRectMm.y,
                ).toBeCloseTo(overlapMm, 7);
              else expect(r.y + r.height).toBeCloseTo(h, 7);
            }
          }
      }
    }
  });
  it('elige menor cobertura sobrante en empate y siempre es determinista', () => {
    const input = { ...base, posterWidthMm: 290, posterHeightMm: 350 };
    const auto = calculateLayout(input);
    const candidates = ['portrait', 'landscape'].map((orientation) =>
      calculateLayout({ ...input, orientation: orientation as 'portrait' | 'landscape' }),
    );
    expect(auto.wasteAreaMm2).toBe(Math.min(...candidates.map((l) => l.wasteAreaMm2)));
    expect(calculateLayout(input)).toEqual(auto);
    expect(rowLabel(26)).toBe('AA');
  });
  it.each([NaN, Infinity, 0, -1])('rechaza dimensiones %s', (v) =>
    expect(() => calculateLayout({ ...base, posterWidthMm: v })).toThrow(),
  );
  it('rechaza márgenes, solapes y exceso de hojas', () => {
    for (const invalid of [
      { marginMm: 108 },
      { overlapMm: 206 },
      { overlapMm: -1 },
      { marginMm: NaN },
      { posterWidthMm: 100_000 },
    ])
      expect(() => calculateLayout({ ...base, ...invalid })).toThrow();
  });
});
describe('ajuste de imagen', () => {
  it('contain, cover y stretch centrados', () => {
    expect(fitImage(200, 100, 100, 100, 'contain')).toEqual({
      x: 0,
      y: 25,
      width: 100,
      height: 50,
    });
    expect(fitImage(200, 100, 100, 100, 'cover')).toEqual({
      x: -50,
      y: 0,
      width: 200,
      height: 100,
    });
    expect(fitImage(200, 100, 100, 100, 'stretch')).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
    expect(() => fitImage(0, 100, 100, 100, 'contain')).toThrow();
  });
});
