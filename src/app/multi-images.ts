import type { ImageAdjustment } from '../core/image-fit';
import type { LoadedImage } from '../image/decode-image';

export type MultiPiece = {
  id: number;
  image: LoadedImage;
  adjustment: ImageAdjustment;
};

export const MAX_DISTINCT_PIECES = 100;
export const MAX_DISTINCT_BYTES = 250 * 1024 * 1024;
