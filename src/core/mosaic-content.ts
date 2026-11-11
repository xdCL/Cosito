import { imageTransform, type ImageRotation } from './image-fit';
import type { Layout, Rect, Tile } from './tiling';

function intersection(a: Rect, b: Rect): Rect | undefined {
  const x = Math.max(a.x, b.x),
    y = Math.max(a.y, b.y);
  const width = Math.min(a.x + a.width, b.x + b.width) - x;
  const height = Math.min(a.y + a.height, b.y + b.height) - y;
  if (width > 1e-7 && height > 1e-7) return { x, y, width, height };
}

export function outsideArtwork(layout: Layout, fitted: Rect) {
  return layout.tiles
    .filter((tile) => !intersection(tile.posterRectMm, fitted))
    .map((tile) => tile.index);
}

/** Keep original grid coordinates and relink only the sheets that will actually print. */
export function omitTiles(layout: Layout, omitted: readonly number[]): Layout {
  if (!omitted.length) return layout;
  const removed = new Set(omitted);
  const remaining = layout.tiles.filter((tile) => !removed.has(tile.index));
  const indices = new Map(remaining.map((tile, i) => [tile.index, i]));
  const neighbour = (index?: number) => (index === undefined ? undefined : indices.get(index));
  return {
    ...layout,
    sheetCount: remaining.length,
    alternativeSheetCount: undefined,
    tiles: remaining.map((tile, index) => {
      const neighbours = {
        left: neighbour(tile.neighbours.left),
        top: neighbour(tile.neighbours.top),
        right: neighbour(tile.neighbours.right),
        bottom: neighbour(tile.neighbours.bottom),
      };
      return {
        ...tile,
        index,
        neighbours,
        overlap: {
          left: neighbours.left === undefined ? 0 : tile.overlap.left,
          top: neighbours.top === undefined ? 0 : tile.overlap.top,
          right: neighbours.right === undefined ? 0 : tile.overlap.right,
          bottom: neighbours.bottom === undefined ? 0 : tile.overlap.bottom,
        },
      };
    }),
  };
}

/** Map a printable rectangle back to the source raster, with a pixel of interpolation room. */
export function sourceRegion(
  tile: Pick<Tile, 'index' | 'posterRectMm'>,
  fitted: Rect,
  rotation: ImageRotation,
  width: number,
  height: number,
) {
  const r = intersection(tile.posterRectMm, fitted);
  if (!r) return;
  const [a, b, c, d, e, f] = imageTransform(fitted, rotation);
  const determinant = a * d - b * c;
  const points = [r.x, r.x + r.width].flatMap((x) =>
    [r.y, r.y + r.height].map((y) => ({
      x: ((d * (x - e) - c * (y - f)) / determinant) * width,
      y: ((a * (y - f) - b * (x - e)) / determinant) * height,
    })),
  );
  const left = Math.max(0, Math.floor(Math.min(...points.map((p) => p.x))) - 1);
  const top = Math.max(0, Math.floor(Math.min(...points.map((p) => p.y))) - 1);
  const right = Math.min(width, Math.ceil(Math.max(...points.map((p) => p.x))) + 1);
  const bottom = Math.min(height, Math.ceil(Math.max(...points.map((p) => p.y))) + 1);
  return { index: tile.index, left, top, right, bottom };
}
