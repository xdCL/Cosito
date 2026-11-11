import type { Layout } from '../core/tiling';
import type { ImageAdjustment } from '../core/image-fit';
import type { RepeatLayout } from '../core/repetition';
export type PdfOptions = {
  imageAdjustment: ImageAdjustment;
  dpi: 150 | 200 | 300;
  cropMarks: boolean;
  alignmentMarks: boolean;
  guide: boolean;
  calibration: boolean;
  filename: string;
  paperName: string;
};
export type Progress = { done: number; total: number; message: string };
export type PdfRequest = { file: File; options: PdfOptions } & (
  | { kind: 'mosaic'; layout: Layout; skipBlank: boolean }
  | { kind: 'repeat'; layout: RepeatLayout; cutGuides: boolean }
);
export type PdfResult = { bytes: Uint8Array; omitted: number[] };
