import { expect, it } from 'vitest';
import { createCanvas } from '@napi-rs/canvas';
import { blankSheets } from '../src/image/blank-sheets';
import type { RasterReader } from '../src/image/decode-image';

it('considera blanco y transparencia, conserva tinta muy tenue y respeta el giro', () => {
  const canvas = createCanvas(100, 100);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 50, 100);
  const tiles = [
    { index: 0, posterRectMm: { x: 0, y: 0, width: 50, height: 100 } },
    { index: 1, posterRectMm: { x: 50, y: 0, width: 50, height: 100 } },
  ];
  const rect = { x: 0, y: 0, width: 100, height: 100 };
  const reader = ctx as unknown as RasterReader;
  expect(blankSheets(reader, 100, 100, tiles, rect, 0)).toEqual([0, 1]);
  ctx.fillStyle = '#fefefe';
  ctx.fillRect(75, 20, 1, 1);
  expect(blankSheets(reader, 100, 100, tiles, rect, 0)).toEqual([0]);
  expect(blankSheets(reader, 100, 100, tiles, rect, 90)).toEqual([0]);
  expect(blankSheets(reader, 100, 100, tiles, rect, 270)).toEqual([1]);
});
