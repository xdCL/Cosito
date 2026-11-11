export const PIECE_PRESETS = {
  sticker: { label: 'Sticker cuadrado · 5 × 5 cm', width: '5', height: '5' },
  card: { label: 'Tarjeta de presentación · 9 × 5 cm', width: '9', height: '5' },
  badge: { label: 'Credencial · 8,56 × 5,398 cm', width: '8.56', height: '5.398' },
} as const;

export type RepeatConfig = {
  preset: keyof typeof PIECE_PRESETS | 'custom';
  width: string;
  height: string;
  gap: string;
  run: 'sheets' | 'copies';
  sheets: string;
  copies: string;
  perSheet: string;
  allowRotation: boolean;
  cutGuides: boolean;
};

export const initialRepeat: RepeatConfig = {
  preset: 'sticker',
  width: '5',
  height: '5',
  gap: '3',
  run: 'sheets',
  sheets: '1',
  copies: '100',
  perSheet: '',
  allowRotation: true,
  cutGuides: false,
};
