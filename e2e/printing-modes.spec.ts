import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFDict, PDFDocument, PDFName } from 'pdf-lib';
import { PNG } from 'pngjs';
import AxeBuilder from '@axe-core/playwright';
import { ptToMm } from '../src/core/units';

function artwork(wide: boolean) {
  const png = new PNG({ width: wide ? 300 : 100, height: 100 });
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      if (wide && x < 100) png.data.set([255, 255, 255, 255], (y * png.width + x) * 4);
      if (wide ? x >= 140 && x < 160 : x >= 25 && x < 75 && y >= 25 && y < 75)
        png.data.set([225, 48, 78, 255], (y * png.width + x) * 4);
    }
  }
  return { name: 'prueba.png', mimeType: 'image/png', buffer: PNG.sync.write(png) };
}

async function exportPdf(page: Page) {
  await page.getByRole('button', { name: 'Crear PDF' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Descargar PDF' }).click();
  return PDFDocument.load(await readFile((await (await download).path())!));
}

test('mosaico omite hojas blancas y transparentes sin perder la posición de la hoja impresa', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles(artwork(true));
  await page.getByLabel('Ancho', { exact: true }).fill('60');
  await page.getByLabel('Alto', { exact: true }).fill('20');
  await page.locator('.advanced > summary').click();
  await page.getByRole('combobox', { name: 'Orientación', exact: true }).selectOption('portrait');
  await expect(page.locator('.sheet-count')).toHaveText('3 hojas');
  const pdf = await exportPdf(page);
  expect(pdf.getPageCount()).toBe(1);
  await expect(page.locator('.sheet-count')).toHaveText('1 hoja');
  await expect(page.getByText('Se omiten 2 hojas sin contenido.')).toBeVisible();
  await expect(page.locator('.preview-tile.omitted')).toHaveCount(2);
  await expect(page.locator('.preview-tile:not(.omitted)')).toHaveText('1A2');
  await page.getByRole('checkbox', { name: 'Omitir hojas sin contenido visible' }).uncheck();
  expect((await exportPdf(page)).getPageCount()).toBe(3);
});

test('100 stickers a 6 por hoja: PDF A4 de 17 hojas con 4 copias en la última', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 840 });
  await page.goto('./');
  await page.getByRole('button', { name: 'Stickers y tarjetas' }).click();
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles(artwork(false));
  await page.getByLabel('Papel', { exact: true }).selectOption('a4');
  await page.getByRole('combobox', { name: 'Plan de impresión' }).selectOption('copies');
  await page.getByRole('spinbutton', { name: 'Cantidad total de copias' }).fill('100');
  await page.getByRole('spinbutton', { name: 'Copias por hoja' }).fill('6');
  await expect(page.locator('.repeat-count')).toHaveText(
    '100 copias · 6 por hoja · 4 en la última',
  );
  await expect(page.locator('.repeat-piece')).toHaveCount(6);
  await page.getByRole('combobox', { name: 'Vista de la hoja' }).selectOption('last');
  await expect(page.locator('.repeat-piece')).toHaveCount(4);
  const preview = PNG.sync.read(await page.locator('.repeat-paper').screenshot());
  let hasArtwork = false;
  for (let i = 0; i < preview.data.length; i += 4) {
    if (preview.data[i] > 190 && preview.data[i + 1] < 80 && preview.data[i + 2] < 120) {
      hasArtwork = true;
      break;
    }
  }
  expect(hasArtwork).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  const pdf = await exportPdf(page);
  expect(pdf.getPageCount()).toBe(17);
  const images = pdf.getPages().flatMap((sheet, i) => {
    expect(ptToMm(sheet.getWidth())).toBeCloseTo(210, 6);
    expect(ptToMm(sheet.getHeight())).toBeCloseTo(297, 6);
    const refs = sheet.node.Resources()?.lookup(PDFName.of('XObject'), PDFDict).values() ?? [];
    expect(refs).toHaveLength(i === 16 ? 4 : 6);
    return refs.map((ref) => ref.toString());
  });
  expect(new Set(images).size).toBe(1);

  await page.getByRole('combobox', { name: 'Formato de pieza' }).selectOption('badge');
  await expect(page.getByLabel('Ancho de la pieza', { exact: true })).toHaveValue('8.56');
  await expect(page.getByLabel('Alto de la pieza', { exact: true })).toHaveValue('5.398');
  await page.getByRole('combobox', { name: 'Plan de impresión' }).selectOption('sheets');
  await page.getByRole('spinbutton', { name: 'Copias por hoja' }).fill('');
  await page.getByRole('spinbutton', { name: 'Hojas a llenar' }).fill('2');
  await expect(page.locator('.sheet-count')).toHaveText('2 hojas');
  await expect(page.locator('.repeat-count')).toHaveText('20 copias · 10 por hoja');
  for (const skin of ['cosito', 'los-leones']) {
    await page.getByLabel('Estilo', { exact: true }).selectOption(skin);
    for (const theme of ['light', 'dark']) {
      await page.getByLabel('Tema', { exact: true }).selectOption(theme);
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
          .violations,
      ).toEqual([]);
    }
  }
});


test('credenciales distintas: carga múltiple, reordena y exporta dos hojas sin duplicados', async ({ page }) => {
  const solid = (name: string, red: number, green: number, blue: number) => {
    const png = new PNG({ width: 80, height: 80 });
    for (let i = 0; i < png.data.length; i += 4) {
      png.data[i] = red;
      png.data[i + 1] = green;
      png.data[i + 2] = blue;
      png.data[i + 3] = 255;
    }
    return { name, mimeType: 'image/png', buffer: PNG.sync.write(png) };
  };
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.getByRole('button', { name: 'Stickers y tarjetas' }).click();
  await page.getByRole('combobox', { name: 'Formato de pieza' }).selectOption('badge');
  await page.getByRole('radio', { name: 'Imágenes diferentes por credencial' }).check();
  await page.getByLabel('Papel', { exact: true }).selectOption('a4');
  await page.getByRole('spinbutton', { name: 'Copias por hoja' }).fill('2');
  await page.getByLabel('Seleccionar imágenes para credenciales').setInputFiles([
    solid('roja.png', 255, 0, 0),
    solid('verde.png', 0, 255, 0),
    solid('azul.png', 0, 0, 255),
  ]);
  await expect(page.locator('.multi-piece')).toHaveCount(3);
  await expect(page.locator('.repeat-count')).toHaveText('3 imágenes · 2 por hoja · 1 en la última');
  await expect(page.locator('.sheet-count')).toHaveText('2 hojas');
  await expect(page.locator('.repeat-piece')).toHaveCount(2);
  await page.getByRole('button', { name: 'Mover credencial 1 hacia adelante' }).click();
  await expect(page.locator('.multi-piece-heading span').first()).toHaveText('verde.png');
  await page.getByRole('combobox', { name: 'Vista de la hoja' }).selectOption('last');
  await expect(page.locator('.repeat-piece')).toHaveCount(1);
  const pdf = await exportPdf(page);
  expect(pdf.getPageCount()).toBe(2);
  const first = pdf.getPage(0).node.Resources()?.lookup(PDFName.of('XObject'), PDFDict);
  const second = pdf.getPage(1).node.Resources()?.lookup(PDFName.of('XObject'), PDFDict);
  expect(first?.values()).toHaveLength(2);
  expect(second?.values()).toHaveLength(1);
  expect(new Set(first?.values().map((ref) => ref.toString())).size).toBe(2);
});
