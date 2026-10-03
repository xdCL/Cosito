import { expect, it } from 'vitest';
import { imageMetadata } from '../src/image/metadata';
import { validateImage } from '../src/image/decode-image';
import { fixturePng } from '../scripts/generate-fixtures';
it('cabecera PNG e imagen válida', async () => {
  const png = fixturePng();
  expect(imageMetadata(png)).toEqual({ width: 500, height: 980, type: 'image/png' });
  expect(await validateImage(new Blob([new Uint8Array(png)]))).toMatchObject({ width: 500 });
});
it('rechaza archivo vacío, corrupto, demasiado grande y dimensiones extremas antes de decode', async () => {
  await expect(validateImage(new Blob([]))).rejects.toThrow();
  await expect(validateImage(new Blob(['no es una imagen']))).rejects.toThrow();
  await expect(validateImage(new Blob([new Uint8Array(31 * 1024 * 1024)]))).rejects.toThrow();
  const png = new Uint8Array(fixturePng());
  new DataView(png.buffer).setUint32(16, 100_000);
  await expect(validateImage(new Blob([png]))).rejects.toThrow('demasiado grande');
});
