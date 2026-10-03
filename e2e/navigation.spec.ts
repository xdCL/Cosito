import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('una columna centrada y navegación flotante en ambas skins y tamaños', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  const toggle = page.getByRole('button', { name: /navegación de secciones/ });
  for (const skin of ['cosito', 'los-leones']) {
    await page.getByLabel('Estilo', { exact: true }).selectOption(skin);
    for (const width of [320, 1366, 1920]) {
      await page.setViewportSize({ width, height: 844 });
      const configuration = (await page.locator('.configuration').boundingBox())!;
      const paper = (await page.locator('#papel').boundingBox())!;
      const result = (await page.locator('#resultado').boundingBox())!;
      expect(result.x).toBeCloseTo(configuration.x, 0);
      expect(result.width).toBeCloseTo(configuration.width, 0);
      expect(result.y).toBeGreaterThanOrEqual(paper.y + paper.height);
      expect(result.x + result.width / 2).toBeCloseTo(width / 2, 0);
      for (const [id, label] of [
        ['imagen', 'Agrega tu imagen'],
        ['medidas', 'Medidas del proyecto'],
        ['papel', 'Papel'],
        ['resultado', 'Vista previa y PDF'],
        ['opciones', 'Opciones avanzadas'],
        ['montaje', 'Guía de montaje'],
      ]) {
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await page
          .getByRole('navigation', { name: 'Secciones del proyecto' })
          .getByRole('link', { name: label })
          .click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        const target = page.locator(id === 'opciones' ? '#opciones > summary' : `#${id}`);
        await expect(target).toBeFocused();
        await expect(page).toHaveURL(new RegExp(`#${id}$`));
        await expect(toggle).toBeInViewport();
        if (id === 'opciones') await expect(page.getByLabel('Ajuste de la imagen')).toBeVisible();
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
  }
});

test('menú: teclado, Escape, cierre externo y accesibilidad', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  const toggle = page.getByRole('button', { name: /navegación de secciones/ });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('navigation', { name: 'Secciones del proyecto' }).getByRole('link').first(),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.locator('h1').click({ position: { x: 8, y: 8 } });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  for (const skin of ['cosito', 'los-leones']) {
    await page.getByLabel('Estilo', { exact: true }).selectOption(skin);
    for (const theme of ['light', 'dark']) {
      await page.getByLabel('Tema', { exact: true }).selectOption(theme);
      await toggle.click();
      expect(
        (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
          .violations,
      ).toEqual([]);
      await page.keyboard.press('Escape');
    }
  }
});
