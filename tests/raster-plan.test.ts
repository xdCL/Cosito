import { expect, it } from 'vitest';
import { planRaster } from '../src/core/raster-plan';
import { LIMITS } from '../src/config/limits';
it('acota resolución y memoria sin cambiar dimensiones físicas', () => {
  for (const [width, height] of [
    [6000, 4000],
    [4000, 6000],
    [12000, 1000],
    [500, 980],
  ]) {
    for (const dpi of [150, 200, 300]) {
      const r = planRaster(width, height, 2000, 3000, dpi);
      expect(r.width).toBeLessThanOrEqual(width);
      expect(r.height).toBeLessThanOrEqual(height);
      expect(Math.max(r.width, r.height)).toBeLessThanOrEqual(LIMITS.maxRasterSide);
      expect(r.width * r.height).toBeLessThanOrEqual(LIMITS.maxRasterPixels);
      expect(r.effectivePpi).toBeGreaterThan(0);
    }
  }
  expect(planRaster(6000, 4000, 2000, 3000, 300).capped).toBe(true);
});
it('la calidad seleccionada sólo modifica el raster, sin ampliar la fuente', () => {
  const low = planRaster(1000, 1000, 25.4, 25.4, 150),
    high = planRaster(1000, 1000, 25.4, 25.4, 300);
  expect(low).toMatchObject({ width: 150, height: 150, effectivePpi: 150 });
  expect(high).toMatchObject({ width: 300, height: 300, effectivePpi: 300 });
  expect(() => planRaster(0, 100, 10, 10, 200)).toThrow();
});
