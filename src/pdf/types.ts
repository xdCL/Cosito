import type { Layout } from '../core/tiling';
import type { ImageFit } from '../core/image-fit';
export type PdfOptions = {
  fit: ImageFit;
  dpi: 150 | 200 | 300;
  cropMarks: boolean;
  alignmentMarks: boolean;
  guide: boolean;
  calibration: boolean;
  filename: string;
  paperName: string;
};
export type Progress = { done: number; total: number; message: string };
export type PdfRequest = { file: File; layout: Layout; options: PdfOptions };
