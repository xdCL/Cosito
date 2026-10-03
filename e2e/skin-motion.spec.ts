import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('skin Los Leones: identidad, persistencia y cambio sin perder el PDF', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Estilo', { exact: true }).selectOption('los-leones');
  await expect(page.getByRole('link', { name: 'Escuela Los Leones, inicio' })).toBeVisible();
  await expect(page).toHaveTitle('El cosito de Los Leones — Impresión en mosaico');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /school-192\.png$/);
  await page.getByLabel('Tema', { exact: true }).selectOption('light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 102, 204)');
  await page.reload();
  await expect(page.getByLabel('Estilo', { exact: true })).toHaveValue('los-leones');
  await expect(page.getByLabel('Tema', { exact: true })).toHaveValue('light');
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles('e2e/fixtures/grid.png');
  await page.getByLabel('Ancho', { exact: true }).fill('29');
  await page.getByLabel('Alto', { exact: true }).fill('35');
  await page.getByRole('button', { name: 'Crear PDF' }).click();
  const download = page.getByRole('link', { name: 'Descargar PDF' });
  await expect(download).toBeVisible();
  const pdfUrl = await download.getAttribute('href');
  for (const skin of ['cosito', 'los-leones']) {
    await page.getByLabel('Estilo', { exact: true }).selectOption(skin);
    await expect(page.getByLabel('Ancho', { exact: true })).toHaveValue('29');
    await expect(page.locator('.sheet-count')).toHaveText('4 hojas');
    await expect(page.locator('.image-info strong')).toHaveText('grid.png');
    await expect(download).toHaveAttribute('href', pdfUrl!);
    await expect(page.locator('.poster')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  }
  await page.evaluate(() => localStorage.setItem('cosito:skin', 'unknown'));
  await page.reload();
  await expect(page.getByLabel('Estilo', { exact: true })).toHaveValue('cosito');
  await expect(page).toHaveTitle('Cosito — Impresión en mosaico');
});

test('Los Leones: contraste, diálogo y móvil en claro, oscuro y sistema', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('./');
  await page.getByLabel('Estilo', { exact: true }).selectOption('los-leones');
  for (const theme of ['light', 'dark', 'system']) {
    await page.getByLabel('Tema', { exact: true }).selectOption(theme);
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
  }
  for (const width of [320, 390, 768, 1366]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByLabel('Estilo', { exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Usar un tamaño frecuente' }).click();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'A3 29,7 × 42 cm', exact: true }).click();
  await expect(page.locator('.sheet-count')).toHaveText('4 hojas');
});

test('animación breve al abrir; movimiento reducido conserva interacción sin animar', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  await page.evaluate(() => {
    document.documentElement.dataset.dialogAnimated = 'false';
    document.addEventListener('animationstart', (e) => {
      if ((e.target as HTMLElement).tagName === 'DIALOG')
        document.documentElement.dataset.dialogAnimated = 'true';
    });
  });
  const open = page.getByRole('button', { name: 'Usar un tamaño frecuente' });
  await open.click();
  await expect(page.locator('html')).toHaveAttribute('data-dialog-animated', 'true');
  await page.keyboard.press('Escape');
  await expect(open).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    document.documentElement.dataset.dialogAnimated = 'false';
  });
  await open.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    ),
  ).toBe(0);
  await page.getByRole('button', { name: 'A3 29,7 × 42 cm', exact: true }).click();
  await expect(page.locator('.sheet-count')).toHaveText('4 hojas');
  await expect(page.locator('html')).toHaveAttribute('data-dialog-animated', 'false');
});
