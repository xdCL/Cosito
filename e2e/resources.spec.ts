import { test, expect } from '@playwright/test';
test('libera URLs y workers al reemplazar imágenes y PDFs', async ({ page }) => {
  await page.addInitScript(() => {
    const audit = { urls: new Set<string>(), workers: 0 };
    Object.defineProperty(window, 'cositoResourceAudit', { value: audit });
    const create = URL.createObjectURL.bind(URL),
      revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      audit.urls.add(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      audit.urls.delete(url);
      revoke(url);
    };
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      private disposed = false;
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        audit.workers++;
      }
      terminate() {
        if (!this.disposed) {
          this.disposed = true;
          audit.workers--;
        }
        super.terminate();
      }
    };
  });
  const counts = () =>
    page.evaluate(() => {
      const audit = (
        window as unknown as { cositoResourceAudit: { urls: Set<string>; workers: number } }
      ).cositoResourceAudit;
      return { urls: audit.urls.size, workers: audit.workers };
    });
  await page.goto('./');
  await page.getByLabel('Ancho', { exact: true }).fill('50');
  await page.getByLabel('Alto', { exact: true }).fill('98');
  for (let i = 0; i < 3; i++) {
    await page.getByLabel('Seleccionar archivo de imagen').setInputFiles('e2e/fixtures/grid.png');
    await expect(page.getByRole('button', { name: 'Crear PDF' })).toBeEnabled();
    await expect.poll(counts).toEqual({ urls: 1, workers: 0 });
    await page.getByRole('button', { name: 'Crear PDF' }).click();
    await expect(page.getByRole('link', { name: 'Descargar PDF' })).toBeVisible();
    await expect.poll(counts).toEqual({ urls: 2, workers: 0 });
    await page.getByLabel('Ancho', { exact: true }).fill(String(50 + i));
    await expect(page.getByRole('link', { name: 'Descargar PDF' })).not.toBeVisible();
    await expect.poll(counts).toEqual({ urls: 1, workers: 0 });
  }
});
test('papel personalizado, ajustes y recuperación de error PDF', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles('e2e/fixtures/grid.png');
  await page.getByLabel('Ancho', { exact: true }).fill('10');
  await page.getByLabel('Alto', { exact: true }).fill('10');
  await page.getByLabel('Papel', { exact: true }).selectOption('custom');
  await page.getByLabel('Ancho del papel', { exact: false }).fill('12');
  await page.getByLabel('Alto del papel', { exact: false }).fill('15');
  await page.locator('.advanced > summary').click();
  await page.getByLabel('Ajuste de la imagen').selectOption('stretch');
  await expect(
    page.getByText('Esta opción puede modificar las proporciones de la imagen.'),
  ).toBeVisible();
  await page.getByLabel('Ajuste de la imagen').selectOption('cover');
  await page.getByLabel('Margen seguro (mm)').fill('0');
  await page.getByLabel('Solape: contenido repetido (mm)').fill('0');
  await expect(page.locator('.sheet-count')).toHaveText('1 hoja');
  await page.getByLabel('Incluir página de calibración (+1 hoja)').check();
  await page.getByRole('button', { name: 'Crear PDF' }).click();
  await expect(page.getByRole('alert')).toContainText('desactiva esta opción');
  await page.getByLabel('Incluir página de calibración (+1 hoja)').uncheck();
  await page.getByRole('button', { name: 'Crear PDF' }).click();
  await expect(page.getByRole('link', { name: 'Descargar PDF' })).toBeVisible();
});
