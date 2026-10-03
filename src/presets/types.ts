export type SizePreset = {
  id: string;
  name: string;
  description?: string;
  widthMm: number;
  heightMm: number;
  category: 'school' | 'paper' | 'display' | 'custom' | (string & {});
  defaultOrientation?: 'portrait' | 'landscape';
  tags?: readonly string[];
  enabled: boolean;
};
