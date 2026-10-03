import { mkdirSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
const glyphs: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  ',': ['0', '0', '0', '1', '1'],
};
export const fixtureColor = (x: number, y: number): number[] =>
  x < 250
    ? y < 490
      ? [245, 201, 126]
      : [163, 210, 181]
    : y < 490
      ? [157, 199, 231]
      : [228, 166, 178];
export function fixturePng(): Buffer {
  const png = new PNG({ width: 500, height: 980 });
  const dot = (x: number, y: number, color: number[] = [30, 50, 40]) => {
    if (x < 0 || y < 0 || x >= 500 || y >= 980) return;
    const i = (y * 500 + x) * 4;
    png.data[i] = color[0];
    png.data[i + 1] = color[1];
    png.data[i + 2] = color[2];
    png.data[i + 3] = 255;
  };
  for (let y = 0; y < 980; y++)
    for (let x = 0; x < 500; x++)
      dot(
        x,
        y,
        x % 100 < 2 || y % 100 < 2 || x > 497 || y > 977 ? [30, 50, 40] : fixtureColor(x, y),
      );
  const label = (text: string, x: number, y: number) => {
    for (const letter of text) {
      const glyph = glyphs[letter];
      if (glyph)
        glyph.forEach((row, dy) =>
          [...row].forEach((v, dx) => {
            if (v === '1')
              for (let sy = 0; sy < 3; sy++)
                for (let sx = 0; sx < 3; sx++) dot(x + dx * 3 + sx, y + dy * 3 + sy);
          }),
        );
      x += 12;
    }
  };
  for (let row = 0; row < 10; row++)
    for (let col = 0; col < 5; col++) {
      label(`${col},${row}`, col * 100 + 9, row * 100 + 8);
      label(String(row * 5 + col + 1), col * 100 + 10, row * 100 + 35);
    }
  // Right and down arrows, asymmetric, to expose inversion or rotation.
  for (let i = 0; i < 45; i++) {
    dot(25 + i, 75);
    dot(75, 25 + i);
  }
  for (let i = 0; i < 12; i++) {
    dot(69 - i, 75 - i);
    dot(69 - i, 75 + i);
    dot(75 - i, 69 - i);
    dot(75 + i, 69 - i);
  }
  return PNG.sync.write(png);
}
mkdirSync('e2e/fixtures', { recursive: true });
writeFileSync('e2e/fixtures/grid.png', fixturePng());
mkdirSync('public/icons', { recursive: true });
for (const { name, background, ink, dot } of [
  { name: 'icon', background: [255, 124, 102], ink: [46, 40, 66], dot: [255, 209, 102] },
  { name: 'school', background: [0, 102, 204], ink: [255, 204, 0], dot: [255, 255, 255] },
])
  for (const size of [192, 512]) {
    const png = new PNG({ width: size, height: size });
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const dx = x / size - 0.5,
          dy = y / size - 0.5;
        const radius = Math.hypot(dx, dy);
        const isC = radius > 0.2 && radius < 0.32 && !(dx > 0.1 && Math.abs(dy) < 0.13);
        const isDot = Math.hypot(dx - 0.22, dy) < 0.055;
        const color = isC ? ink : isDot ? dot : background;
        png.data.set([...color, 255], i);
      }
    writeFileSync(`public/icons/${name}-${size}.png`, PNG.sync.write(png));
  }
