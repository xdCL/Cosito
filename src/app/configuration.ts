import type { Orientation } from '../core/tiling';
import type { ImageFit } from '../core/image-fit';
export type Config = {
  width: string;
  height: string;
  paperId: string;
  customWidth: string;
  customHeight: string;
  margin: string;
  overlap: string;
  orientation: Orientation;
  fit: ImageFit;
  dpi: 150 | 200 | 300;
  cropMarks: boolean;
  alignmentMarks: boolean;
  guide: boolean;
  calibration: boolean;
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
  fit: 'contain',
  dpi: 200,
  cropMarks: true,
  alignmentMarks: true,
  guide: false,
  calibration: false,
};
export const numeric = (text: string) => (text.trim() ? Number(text.replace(',', '.')) : NaN);
export type ChangeConfig = <K extends keyof Config>(key: K, value: Config[K]) => void;
