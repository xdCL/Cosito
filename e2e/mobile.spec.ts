import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('móvil: papel, presets personales, diálogo y descarga', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles('e2e/fixtures/grid.png');
  await page.getByLabel('Ancho', { exact: true }).fill('73');
  await page.getByLabel('Alto', { exact: true }).fill('46');
  await page.getByRole('button', { name: 'Usar un tamaño frecuente' }).click();
  await page.getByLabel('Guardar 73 × 46 cm como tamaño frecuente').fill('Panel de prueba');
  await page.getByRole('button', { name: 'Guardar tamaño', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Panel de prueba 73 × 46 cm', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Renombrar Panel de prueba' }).click();
  await page.getByLabel('Nuevo nombre').fill('Panel renombrado');
  await page.getByRole('button', { name: 'Guardar nombre' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByLabel('Papel', { exact: true }).selectOption('a4');
  await expect(page.locator('.layout-description')).toContainText('A4');
  await page.getByRole('button', { name: 'Usar un tamaño frecuente' }).click();
  await page.getByRole('button', { name: 'Panel renombrado 73 × 46 cm', exact: true }).click();
  await expect(page.getByLabel('Ancho', { exact: true })).toHaveValue('73');
  await page.getByRole('button', { name: 'Crear PDF' }).click();
  await expect(page.getByRole('link', { name: 'Descargar PDF' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('responsive: sin overflow en todas las medidas, tema oscuro y zoom 200 %', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByLabel('Tema', { exact: true }).selectOption('dark');
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles('e2e/fixtures/grid.png');
  await page.getByLabel('Ancho', { exact: true }).fill('73');
  await page.getByLabel('Alto', { exact: true }).fill('46');
  for (const [width, height] of [
    [320, 568],
    [375, 667],
    [390, 844],
    [768, 1024],
    [1024, 768],
    [1366, 768],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `ancho ${width}`,
    ).toBe(true);
    await expect(page.getByLabel('Ancho', { exact: true })).toBeVisible();
    await expect(page.locator('.poster')).toBeVisible();
    await page.screenshot({
      path: `test-results/responsive-${test.info().project.name}-${width}.png`,
      fullPage: true,
    });
  }
  // A 1366px screen at 200% has an effective CSS viewport of 683px.
  await page.setViewportSize({ width: 683, height: 384 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Usar un tamaño frecuente' }).click();
  const bounds = await page.getByRole('dialog').boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(384);
});
test('accesibilidad: claro, oscuro, labels, foco y trap de diálogo', async ({ page }) => {
  await page.goto('./');
  for (const theme of ['light', 'dark']) {
    await page.getByLabel('Tema', { exact: true }).selectOption(theme);
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
  }
  await page.getByRole('button', { name: 'Usar un tamaño frecuente' }).click();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() => document.querySelector('dialog')?.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Usar un tamaño frecuente' })).toBeFocused();
});
