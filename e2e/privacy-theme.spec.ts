import { test, expect } from '@playwright/test';
test('temas persistentes, sistema y papel blanco', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('./');
  await expect(page.getByLabel('Tema', { exact: true })).toHaveValue('system');
  const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.getByLabel('Tema', { exact: true }).selectOption('light');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(
    darkBg,
  );
  await page.reload();
  await expect(page.getByLabel('Tema', { exact: true })).toHaveValue('light');
  await page.getByLabel('Tema', { exact: true }).selectOption('dark');
  await page.getByLabel('Ancho', { exact: true }).fill('73');
  await page.getByLabel('Alto', { exact: true }).fill('46');
  await expect(page.locator('.poster')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.evaluate(() => localStorage.setItem('cosito:theme', 'garbage'));
  await page.reload();
  await expect(page.getByLabel('Tema', { exact: true })).toHaveValue('system');
});
test('seleccionar y generar no sube archivos ni usa destinos externos', async ({ page }) => {
  await page.goto('./');
  const requests: { url: string; method: string }[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles('e2e/fixtures/grid.png');
  await page.getByLabel('Ancho', { exact: true }).fill('73');
  await page.getByLabel('Alto', { exact: true }).fill('46');
  await page.getByRole('button', { name: 'Crear PDF' }).click();
  await expect(page.getByRole('link', { name: 'Descargar PDF' })).toBeVisible();
  expect(
    requests.filter(
      (r) =>
        /^https?:/.test(r.url) &&
        (new URL(r.url).origin !== 'http://localhost:4173' ||
          r.method !== 'GET' ||
          r.url.includes('grid.png')),
    ),
  ).toEqual([]);
});
test('PWA: volver a abrir offline, cargar imagen y crear PDF desde /Cosito/', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName === 'webkit',
    'Playwright 1.63 WebKit offline navigation regression: microsoft/playwright#42775. Validate on real Safari.',
  );
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.getByText('Disponible sin conexión en este dispositivo.')).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles('e2e/fixtures/grid.png');
  await page.getByLabel('Ancho', { exact: true }).fill('50');
  await page.getByLabel('Alto', { exact: true }).fill('98');
  await page.getByRole('button', { name: 'Crear PDF' }).click();
  await expect(page.getByRole('link', { name: 'Descargar PDF' })).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Descargar PDF' }).click();
  expect((await pending).suggestedFilename()).toContain('cosito.pdf');
  await context.setOffline(false);
});
