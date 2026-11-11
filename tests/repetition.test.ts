import { describe, expect, it } from 'vitest';
import { calculateRepetition, type RepeatInput } from '../src/core/repetition';
import { calculateLayout } from '../src/core/tiling';
import { omitTiles, outsideArtwork } from '../src/core/mosaic-content';

const base: RepeatInput = {
  widthMm: 50,
  heightMm: 50,
  paperWidthMm: 210,
  paperHeightMm: 297,
  marginMm: 5,
  gapMm: 3,
  orientation: 'auto',
  allowRotation: true,
  run: { kind: 'copies', count: 100 },
  perSheet: 6,
};

describe('tiradas a tamaño real', () => {
  it('imprime 100 piezas a 6 por hoja en 17 hojas, sin completar de más la última', () => {
    const layout = calculateRepetition(base);
    expect(layout).toMatchObject({
      copies: 100,
      sheetCount: 17,
      perSheet: 6,
      lastSheetCount: 4,
      capacity: 15,
    });
    expect(layout.slots).toHaveLength(6);
    expect(layout.slots[1].x - layout.slots[0].x - layout.slots[0].width).toBeCloseTo(3, 9);
  });

  it('aprovecha la cuadrícula de credenciales con giro cuando el papel es vertical', () => {
    const input: RepeatInput = {
      ...base,
      widthMm: 53.98,
      heightMm: 85.6,
      orientation: 'portrait',
      perSheet: undefined,
      run: { kind: 'sheets', count: 2 },
    };
    expect(calculateRepetition({ ...input, allowRotation: false }).capacity).toBe(9);
    const layout = calculateRepetition(input);
    expect(layout).toMatchObject({ rotated: true, capacity: 10, copies: 20, sheetCount: 2 });
    for (const slot of layout.slots) {
      expect(slot.width).toBeCloseTo(85.6, 9);
      expect(slot.height).toBeCloseTo(53.98, 9);
      expect(slot.x).toBeGreaterThanOrEqual(5 - 1e-7);
      expect(slot.y + slot.height).toBeLessThanOrEqual(292 + 1e-7);
    }
    expect(() => calculateRepetition({ ...input, perSheet: 11 })).toThrow('Caben hasta 10');
    expect(() => calculateRepetition({ ...input, widthMm: 300 })).toThrow('no cabe');
  });
});

it('omite celdas fuera de la imagen sin desplazar las posiciones del mosaico', () => {
  const original = calculateLayout({
    posterWidthMm: 850,
    posterHeightMm: 200,
    paperWidthMm: 215.9,
    paperHeightMm: 279.4,
    marginMm: 5,
    overlapMm: 5,
    orientation: 'landscape',
  });
  const omitted = outsideArtwork(original, { x: 325, y: 0, width: 200, height: 200 });
  expect(omitted).toEqual([0, 2, 3]);
  const print = omitTiles(original, omitted);
  expect(print).toMatchObject({ sheetCount: 1, columns: 4, posterWidthMm: 850 });
  expect(print.tiles[0]).toMatchObject({
    index: 0,
    label: 'A2',
    posterRectMm: original.tiles[1].posterRectMm,
    overlap: { left: 0, right: 0 },
  });
});
