import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { ptToMm } from '../src/core/units';
const fixture = 'e2e/fixtures/grid.png';

test('inicio sin tamaño fijo, instrucciones y elección de un tamaño frecuente', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page.getByLabel('Ancho', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Alto', { exact: true })).toHaveValue('');
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles(fixture);
  await expect(page.locator('.image-info img')).toBeVisible();
  await expect(page.locator('#config-error')).toHaveText(
    'Completa tus medidas para ver el mosaico.',
  );
  await expect(page.locator('#config-error')).not.toHaveClass('error');
  await expect(page.getByLabel('Ancho', { exact: true })).toHaveAttribute('aria-invalid', 'false');
  await expect(page.locator('.sheet-count')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Crear PDF' })).toBeDisabled();
  await page.getByRole('button', { name: 'Usar un tamaño frecuente' }).click();
  await expect(page.getByRole('dialog')).not.toContainText('NaN');
  await expect(page.getByRole('button', { name: 'Guardar tamaño', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'A3 29,7 × 42 cm', exact: true }).click();
  await expect(page.getByLabel('Ancho', { exact: true })).toHaveValue('29.7');
  await expect(page.getByLabel('Alto', { exact: true })).toHaveValue('42');
  await expect(page.locator('.sheet-count')).toHaveText('4 hojas');
  await expect(page.getByRole('button', { name: 'Crear PDF' })).toBeEnabled();
});
test('desktop: 50 × 98 cm, 10 hojas, descarga y PDF físico', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles(fixture);
  await page.getByLabel('Ancho', { exact: true }).fill('50');
  await page.getByLabel('Alto', { exact: true }).fill('98');
  await expect(page.getByRole('heading', { name: 'Tu mosaico está listo' })).toBeVisible();
  await expect(page.locator('.sheet-count')).toHaveText('10 hojas');
  await expect(page.locator('.layout-description')).toContainText('horizontal');
  await expect(page.locator('.layout-description')).toContainText('2 columnas × 5 filas');
  await page.getByRole('button', { name: 'Crear PDF', exact: false }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Descargar PDF' }).click();
  const pdfFile = await download;
  expect(pdfFile.suggestedFilename()).toBe('grid-50x98cm-letter-cosito.pdf');
  const doc = await PDFDocument.load(await readFile((await pdfFile.path())!));
  expect(doc.getPageCount()).toBe(10);
  for (const p of [doc.getPage(0), doc.getPage(9)]) {
    expect(ptToMm(p.getWidth())).toBeCloseTo(279.4, 6);
    expect(ptToMm(p.getHeight())).toBeCloseTo(215.9, 6);
  }
  expect(errors).toEqual([]);
});
test('29 × 35 cm, configuración inválida y preservación de imagen', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles(fixture);
  await page.getByLabel('Ancho', { exact: true }).fill('29');
  await page.getByLabel('Alto', { exact: true }).fill('35');
  await expect(page.locator('.sheet-count')).toHaveText('4 hojas');
  await page.getByLabel('Ancho', { exact: true }).fill('0');
  await expect(page.getByRole('button', { name: 'Crear PDF' })).toBeDisabled();
  await expect(page.locator('#config-error')).toContainText('mayores que cero');
  await page.getByLabel('Ancho', { exact: true }).fill('29');
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles({
    name: 'bad.png',
    mimeType: 'image/png',
    buffer: Buffer.from('no es una imagen'),
  });
  await expect(page.getByRole('alert')).toContainText('No pudimos abrir');
  await expect(page.locator('.image-info strong')).toHaveText('grid.png');
  await expect(page.getByRole('button', { name: 'Crear PDF' })).toBeEnabled();
});
test('cancelar, conservar trabajo y volver a generar', async ({ page }) => {
  // Hold preparation in both execution paths. WebKit can use the HTML fallback;
  // a fixed delay can expire while Playwright scrolls to the cancel button.
  await page.addInitScript(() => {
    let holdNextRead = false;
    let releaseRead: (() => void) | undefined;
    window.addEventListener('cosito:test:hold-pdf', () => {
      holdNextRead = true;
    });
    window.addEventListener('cosito:test:release-pdf', () => releaseRead?.());
    const nativeRead = Blob.prototype.arrayBuffer;
    Blob.prototype.arrayBuffer = async function () {
      if (holdNextRead) {
        holdNextRead = false;
        await new Promise<void>((resolve) => {
          releaseRead = resolve;
        });
      }
      return nativeRead.call(this);
    };
    const NativeWorker = window.Worker;
    let holdFirstRequest = true;
    window.Worker = class extends NativeWorker {
      postMessage(message: unknown) {
        if (holdFirstRequest) {
          holdFirstRequest = false;
          return;
        }
        super.postMessage(message);
      }
    };
  });
  await page.goto('./');
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles(fixture);
  await expect(page.locator('.image-info img')).toBeVisible();
  await page.getByLabel('Ancho', { exact: true }).fill('50');
  await page.getByLabel('Alto', { exact: true }).fill('98');
  await page.evaluate(() => window.dispatchEvent(new Event('cosito:test:hold-pdf')));
  await page.getByRole('button', { name: 'Crear PDF' }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('cosito:test:release-pdf')));
  await expect(page.getByRole('button', { name: 'Crear PDF' })).toBeEnabled();
  await expect(page.getByText('Generación cancelada.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Crear PDF' }).click();
  await expect(page.getByRole('link', { name: 'Descargar PDF' })).toBeVisible();
});
test('alternativa sin createImageBitmap, OffscreenCanvas ni Worker y páginas opcionales', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'createImageBitmap', { value: undefined });
    Object.defineProperty(window, 'OffscreenCanvas', { value: undefined });
    Object.defineProperty(window, 'Worker', { value: undefined });
  });
  await page.goto('./');
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles(fixture);
  await page.getByLabel('Ancho', { exact: true }).fill('50');
  await page.getByLabel('Alto', { exact: true }).fill('98');
  await page.locator('.advanced > summary').click();
  await page.getByLabel('Incluir guía de montaje en PDF (+1 hoja)').check();
  await page.getByLabel('Incluir página de calibración (+1 hoja)').check();
  await page.getByRole('button', { name: 'Crear PDF' }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Descargar PDF' }).click();
  const downloaded = await pending;
  const doc = await PDFDocument.load(await readFile((await downloaded.path())!));
  expect(doc.getPageCount()).toBe(12);
});
test('JPG y WEBP reales', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles(fixture);
  await page.getByLabel('Ancho', { exact: true }).fill('73');
  await page.getByLabel('Alto', { exact: true }).fill('46');
  await expect(page.locator('.image-info img')).toBeVisible();
  for (const type of ['image/jpeg', 'image/webp']) {
    const bytes = await page.evaluate(async (mime) => {
      const img = document.querySelector('.image-info img') as HTMLImageElement;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 250;
      canvas.height = 490;
      canvas.getContext('2d')!.drawImage(img, 0, 0, 250, 490);
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), mime));
      return { type: blob.type, bytes: Array.from(new Uint8Array(await blob.arrayBuffer())) };
    }, type);
    // WebKit may not encode WEBP; use a checked-in WEBP fixture in that case.
    const input =
      bytes.type === type
        ? {
            name: type === 'image/jpeg' ? 'test.jpg' : 'test.webp',
            mimeType: type,
            buffer: Buffer.from(bytes.bytes),
          }
        : 'e2e/fixtures/grid.webp';
    await page.getByLabel('Seleccionar archivo de imagen').setInputFiles(input);
    await expect(page.locator('.image-info strong')).toHaveText(
      type === 'image/jpeg' ? 'test.jpg' : bytes.type === type ? 'test.webp' : 'grid.webp',
    );
    await page.getByRole('button', { name: 'Crear PDF' }).click();
    await expect(page.getByRole('link', { name: 'Descargar PDF' })).toBeVisible();
  }
});
