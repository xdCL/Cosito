import { sourceRegion } from '../core/mosaic-content';
import type { Rect, Tile } from '../core/tiling';
import type { ImageRotation } from '../core/image-fit';
import type { RasterReader } from './decode-image';

export function blankSheets(
  reader: RasterReader,
  width: number,
  height: number,
  tiles: readonly Pick<Tile, 'index' | 'posterRectMm'>[],
  fitted: Rect,
  rotation: ImageRotation,
) {
  const regions = tiles.flatMap((tile) => {
    const region = sourceRegion(tile, fitted, rotation, width, height);
    return region ? [region] : [];
  });
  const ink = new Set<number>();
  const prefix = new Uint32Array(width + 1);
  // Read strips so inspecting a large image never needs a second full-size RGBA buffer.
  for (let top = 0; top < height && ink.size < regions.length; top += 32) {
    const rows = Math.min(32, height - top);
    const pending = regions.filter(
      (r) => !ink.has(r.index) && r.bottom > top && r.top < top + rows,
    );
    if (!pending.length) continue;
    const pixels = reader.getImageData(0, top, width, rows).data;
    for (let y = 0; y < rows; y++) {
      const active = pending.filter(
        (r) => !ink.has(r.index) && r.top <= top + y && r.bottom > top + y,
      );
      if (!active.length) continue;
      for (let x = 0, i = y * width * 4; x < width; x++, i += 4) {
        const visible =
          pixels[i + 3] !== 0 &&
          (pixels[i] !== 255 || pixels[i + 1] !== 255 || pixels[i + 2] !== 255);
        prefix[x + 1] = prefix[x] + Number(visible);
      }
      for (const r of active) if (prefix[r.right] > prefix[r.left]) ink.add(r.index);
    }
  }
  return tiles.filter((tile) => !ink.has(tile.index)).map((tile) => tile.index);
}
