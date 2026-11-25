import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import AxeBuilder from '@axe-core/playwright';
import { ptToMm } from '../src/core/units';

test('seis hojas exactas: vertical, horizontal, cambios de papel y PDF', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles('e2e/fixtures/grid.png');
  await page.getByLabel('Por cantidad de hojas', { exact: true }).check();
  await page.getByLabel('Orientación de las hojas', { exact: true }).selectOption('portrait');
  await page.getByLabel('Distribución del mosaico').selectOption('2');
  await expect(page.locator('.sheet-count')).toHaveText('6 hojas');
  await expect(page.locator('.layout-description')).toContainText('2 columnas × 3 filas');
  await expect(page.locator('.preview-tile')).toHaveCount(6);
  await page.getByLabel('Distribución del mosaico').selectOption('3');
  await expect(page.locator('.layout-description')).toContainText('3 columnas × 2 filas');
  await page.getByLabel('Papel', { exact: true }).selectOption('a4');
  await expect(page.locator('.sheet-count')).toHaveText('6 hojas');
  await expect(page.locator('.finished-size')).toContainText('59 × 56,9 cm');
  await page.locator('.advanced > summary').click();
  await expect(page.getByLabel('Omitir hojas sin contenido visible')).not.toBeChecked();
  await expect(page.getByLabel('Omitir hojas sin contenido visible')).toBeDisabled();
  await page.getByRole('button', { name: 'Crear PDF' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Descargar PDF' }).click();
  const pdf = await PDFDocument.load(await readFile((await (await downloadPromise).path())!));
  expect(pdf.getPageCount()).toBe(6);
  for (const sheet of pdf.getPages()) {
    expect(ptToMm(sheet.getWidth())).toBeCloseTo(210, 6);
    expect(ptToMm(sheet.getHeight())).toBeCloseTo(297, 6);
  }
  // Even a very wide grid retains blank sheets and uses the requested paper orientation.
  await page.getByLabel('Distribución del mosaico').selectOption('6');
  await page.getByLabel('Orientación de las hojas').selectOption('landscape');
  await page.getByLabel('Incluir guía de montaje en PDF (+1 hoja)', { exact: true }).check();
  await page.getByLabel('Incluir página de calibración (+1 hoja)', { exact: true }).check();
  await page.getByRole('button', { name: 'Crear PDF' }).click();
  const nextDownload = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Descargar PDF' }).click();
  const next = await PDFDocument.load(await readFile((await (await nextDownload).path())!));
  expect(next.getPageCount()).toBe(8);
  expect(ptToMm(next.getPage(0).getWidth())).toBeCloseTo(297, 6);
  expect(ptToMm(next.getPage(0).getHeight())).toBeCloseTo(210, 6);
});

test('valida la cantidad, renueva distribuciones y conserva medidas al volver de modo', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByLabel('Ancho', { exact: true }).fill('50');
  await page.getByLabel('Alto', { exact: true }).fill('98');
  await page.getByLabel('Por cantidad de hojas', { exact: true }).check();
  await page.getByLabel('Distribución del mosaico').selectOption('2');
  const count = page.getByLabel('Cantidad de hojas', { exact: true });
  for (const invalid of ['', '0', '101', '2.5']) {
    await count.fill(invalid);
    await expect(page.locator('#config-error')).toContainText('cantidad entera entre 1 y 100');
    await expect(page.getByRole('button', { name: 'Crear PDF' })).toBeDisabled();
  }
  await count.fill('7');
  await expect(page.getByLabel('Distribución del mosaico')).toHaveValue('auto');
  await expect(page.getByLabel('Distribución del mosaico').locator('option')).toHaveCount(3);
  await expect(page.locator('.sheet-count')).toHaveText('7 hojas');
  await page.getByLabel('Por tamaño en centímetros').check();
  await expect(page.getByLabel('Ancho', { exact: true })).toHaveValue('50');
  await expect(page.getByLabel('Alto', { exact: true })).toHaveValue('98');
  await expect(page.locator('.sheet-count')).toHaveText('10 hojas');
  await page.getByLabel('Por cantidad de hojas', { exact: true }).check();
  await expect(count).toHaveValue('7');
  await page.getByRole('button', { name: 'Stickers y tarjetas' }).click();
  await expect(count).toBeHidden();
  await page.getByRole('button', { name: 'Póster en mosaico' }).click();
  await expect(count).toHaveValue('7');
});

test('cantidad de hojas accesible y sin desbordamiento en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('./');
  await page.getByLabel('Por cantidad de hojas', { exact: true }).check();
  await page.getByLabel('Cantidad de hojas', { exact: true }).fill('100');
  await page.getByLabel('Distribución del mosaico').selectOption('10');
  await expect(page.locator('.sheet-count')).toHaveText('100 hojas');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  const report = await new AxeBuilder({ page }).analyze();
  expect(report.violations).toEqual([]);
});
