import type { SizePreset } from '../presets/types';
// Sólo medidas conocidas. Agregar tamaños institucionales cuando se hayan medido.
export const BUILTIN_SIZE_PRESETS: readonly SizePreset[] = [
  {
    id: 'paper-a3',
    name: 'A3',
    description: 'Dos hojas A4',
    widthMm: 297,
    heightMm: 420,
    category: 'paper',
    enabled: true,
  },
  {
    id: 'paper-a2',
    name: 'A2',
    description: 'Un cartel mediano',
    widthMm: 420,
    heightMm: 594,
    category: 'paper',
    enabled: true,
  },
  {
    id: 'paper-a1',
    name: 'A1',
    description: 'Un cartel grande',
    widthMm: 594,
    heightMm: 841,
    category: 'paper',
    enabled: true,
  },
  {
    id: 'paper-a0',
    name: 'A0',
    description: 'Un cartel de gran formato',
    widthMm: 841,
    heightMm: 1189,
    category: 'paper',
    enabled: true,
  },
];
