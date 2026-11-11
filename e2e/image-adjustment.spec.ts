import { expect, test } from '@playwright/test';
import { createCanvas } from '@napi-rs/canvas';
import { readFile } from 'node:fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PNG } from 'pngjs';
import { calculateLayout } from '../src/core/tiling';
import { mmToPt } from '../src/core/units';

const red = [230, 50, 60];
const green = [20, 180, 80];
const blue = [30, 90, 230];
const yellow = [255, 210, 10];
const white = [255, 255, 255];

function quadrantImage() {
  const png = new PNG({ width: 120, height: 60 });
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const color = y < 30 ? (x < 60 ? red : green) : x < 60 ? blue : yellow;
      png.data.set([...color, 255], (y * png.width + x) * 4);
    }
  }
  return { name: 'cuadrantes.png', mimeType: 'image/png', buffer: PNG.sync.write(png) };
}

test('giro y centrado coinciden en el lienzo y en las cuatro hojas del PDF', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 840 });
  await page.goto('./');
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles(quadrantImage());
  await page.getByLabel('Ancho', { exact: true }).fill('30');
  await page.getByLabel('Alto', { exact: true }).fill('30');
  const preview = page.locator('.poster canvas');
  const pixel = (x: number, y: number) =>
    preview.evaluate(
      (canvas: HTMLCanvasElement, [px, py]) => {
        const sample = canvas
          .getContext('2d')!
          .getImageData(
            Math.floor((px / 300) * canvas.width),
            Math.floor((py / 300) * canvas.height),
            1,
            1,
          );
        return Array.from(sample.data.slice(0, 3));
      },
      [x, y],
    );
  const turnLeft = page.getByRole('button', { name: 'Girar 90° a la izquierda' });
  const turnRight = page.getByRole('button', { name: 'Girar 90° a la derecha' });
  await expect.poll(() => pixel(75, 110)).toEqual(red);
  await turnLeft.click();
  await expect.poll(() => pixel(110, 75)).toEqual(green);
  await turnRight.click();
  await expect.poll(() => pixel(75, 110)).toEqual(red);
  await turnRight.click();
  await expect.poll(() => pixel(110, 75)).toEqual(blue);

  await page.getByLabel('Posición horizontal').selectOption('start');
  await expect.poll(() => pixel(37.5, 75)).toEqual(blue);
  await expect.poll(() => pixel(215, 75)).toEqual(white);
  await page.getByLabel('Posición vertical').selectOption('end');
  await page.getByRole('button', { name: 'Centrar imagen' }).click();
  await expect(page.getByLabel('Posición horizontal')).toHaveValue('center');
  await expect(page.getByLabel('Posición vertical')).toHaveValue('center');
  await expect(page.locator('.image-rotation')).toHaveText('Giro: 90°');
  await expect(page.locator('.sheet-count')).toHaveText('4 hojas');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.locator('.advanced > summary').click();
  await page.getByRole('combobox', { name: 'Orientación', exact: true }).selectOption('portrait');
  await page.getByLabel('Marcas de corte').uncheck();
  await page.getByLabel('Marcas de alineación').uncheck();
  const samples = [
    { x: 110, y: 75, color: blue },
    { x: 215, y: 75, color: red },
    { x: 110, y: 280, color: yellow },
    { x: 215, y: 280, color: green },
    { x: 37.5, y: 75, color: white },
    { x: 262.5, y: 280, color: white },
  ];
  for (const { x, y, color } of samples) await expect.poll(() => pixel(x, y)).toEqual(color);
  await page.getByRole('button', { name: 'Crear PDF' }).click();
  const pending = page.waitForEvent('download');
  const download = page.getByRole('link', { name: 'Descargar PDF' });
  await download.click();
  const file = await pending;
  const task = getDocument({
    data: new Uint8Array(await readFile((await file.path())!)),
    useSystemFonts: true,
  });
  try {
    const pdf = await task.promise;
    const layout = calculateLayout({
      posterWidthMm: 300,
      posterHeightMm: 300,
      paperWidthMm: 215.9,
      paperHeightMm: 279.4,
      marginMm: 5,
      overlapMm: 5,
      orientation: 'portrait',
    });
    expect(pdf.numPages).toBe(4);
    for (const tile of layout.tiles) {
      const pdfPage = await pdf.getPage(tile.index + 1);
      const viewport = pdfPage.getViewport({ scale: 1 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const ctx = canvas.getContext('2d');
      await pdfPage.render({ canvas: canvas as unknown as HTMLCanvasElement, viewport }).promise;
      const r = tile.posterRectMm;
      const points = samples.filter(
        ({ x, y }) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height,
      );
      expect(points.length).toBeGreaterThan(0);
      for (const { x, y, color } of points) {
        const px = Math.round(mmToPt(tile.pageRectMm.x + x - r.x));
        const py = Math.round(mmToPt(tile.pageRectMm.y + y - r.y));
        expect(Array.from(ctx.getImageData(px, py, 1, 1).data.slice(0, 3))).toEqual(color);
      }
      pdfPage.cleanup();
    }
  } finally {
    await task.destroy();
  }
  await turnRight.click();
  await expect(download).toBeHidden();
  await expect(page.getByRole('button', { name: 'Crear PDF' })).toBeEnabled();
});
