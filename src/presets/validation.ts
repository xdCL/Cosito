import { validDimension } from '../core/validation';
import type { SizePreset } from './types';
export function isSizePreset(value: unknown): value is SizePreset {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    /^[a-zA-Z0-9_-]{1,100}$/.test(p.id) &&
    typeof p.name === 'string' &&
    p.name.trim().length > 0 &&
    p.name.length <= 80 &&
    typeof p.widthMm === 'number' &&
    validDimension(p.widthMm) &&
    typeof p.heightMm === 'number' &&
    validDimension(p.heightMm) &&
    typeof p.category === 'string' &&
    p.category.length > 0 &&
    p.category.length <= 80 &&
    typeof p.enabled === 'boolean' &&
    (p.description === undefined ||
      (typeof p.description === 'string' && p.description.length <= 300)) &&
    (p.defaultOrientation === undefined ||
      p.defaultOrientation === 'portrait' ||
      p.defaultOrientation === 'landscape') &&
    (p.tags === undefined ||
      (Array.isArray(p.tags) &&
        p.tags.length <= 20 &&
        p.tags.every((t) => typeof t === 'string' && t.length <= 80)))
  );
}
export function validatePresetRegistry(items: readonly SizePreset[]): void {
  const ids = new Set<string>();
  for (const preset of items) {
    if (!isSizePreset(preset)) throw new Error('Preset inválido en el registro.');
    if (ids.has(preset.id)) throw new Error(`Id de preset duplicado: ${preset.id}`);
    ids.add(preset.id);
  }
}
export const enabledPresets = (items: readonly SizePreset[]) => items.filter((p) => p.enabled);
// Único efecto de elegir un preset: completar las dimensiones del dominio.
export const presetDimensions = (p: SizePreset) => ({
  posterWidthMm: p.widthMm,
  posterHeightMm: p.heightMm,
});
