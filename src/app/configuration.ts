import type { Orientation } from '../core/tiling';
import { DEFAULT_IMAGE_ADJUSTMENT, type ImageAdjustment } from '../core/image-fit';
export type Config = {
  width: string;
  height: string;
  paperId: string;
  customWidth: string;
  customHeight: string;
  margin: string;
  overlap: string;
  orientation: Orientation;
  imageAdjustment: ImageAdjustment;
  dpi: 150 | 200 | 300;
  cropMarks: boolean;
  alignmentMarks: boolean;
  guide: boolean;
  calibration: boolean;
  skipBlank: boolean;
};
export const initial: Config = {
  width: '',
  height: '',
  paperId: 'letter',
  customWidth: '21',
  customHeight: '29.7',
  margin: '5',
  overlap: '5',
  orientation: 'auto',
  imageAdjustment: DEFAULT_IMAGE_ADJUSTMENT,
  dpi: 200,
  cropMarks: true,
  alignmentMarks: true,
  guide: false,
  calibration: false,
  skipBlank: true,
};
export const numeric = (text: string) => (text.trim() ? Number(text.replace(',', '.')) : NaN);
export type ChangeConfig = <K extends keyof Config>(key: K, value: Config[K]) => void;
