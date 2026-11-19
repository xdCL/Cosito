import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const fixture = 'e2e/fixtures/grid.png';

test('modal de actualización cubre la página y exige escoger una acción', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  const modal = page.locator('dialog.update-dialog');
  await expect(modal).not.toBeVisible();
  // Emulate the display state normally triggered by a waiting PWA service worker.
  await modal.evaluate((element: HTMLDialogElement) => element.showModal());
  await expect(modal).toBeVisible();
  expect(await modal.evaluate((element) => element.matches(':modal'))).toBe(true);
  await expect(page.getByRole('heading', { name: /nueva versión de/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Actualizar ahora' })).toBeVisible();

  // Escape must not silently discard the update decision.
  await page.keyboard.press('Escape');
  await expect(modal).toBeVisible();
  const violations = (
    await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  ).violations;
  expect(violations).toEqual([]);
  await page.getByRole('button', { name: 'Seguir trabajando' }).click();
  await expect(modal).not.toBeVisible();
});

test('si hay un PDF preparado, advierte antes de actualizar y permite conservarlo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.getByLabel('Seleccionar archivo de imagen').setInputFiles(fixture);
  await page.getByLabel('Ancho', { exact: true }).fill('29');
  await page.getByLabel('Alto', { exact: true }).fill('35');
  await page.getByRole('button', { name: 'Crear PDF' }).click();
  const download = page.getByRole('link', { name: 'Descargar PDF' });
  await expect(download).toBeVisible();

  const modal = page.locator('dialog.update-dialog');
  await modal.evaluate((element: HTMLDialogElement) => element.showModal());
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('Descarga tu PDF antes de actualizar');
  await expect(page.getByRole('button', { name: 'Seguir trabajando' })).toBeFocused();
  await page.getByRole('button', { name: 'Seguir trabajando' }).click();
  await expect(download).toBeVisible();
});
