import { isSizePreset, validatePresetRegistry } from './validation';
import type { SizePreset } from './types';
export type UserPresetData = { version: 1; items: SizePreset[] };
export function migrateUserPresets(raw: unknown): UserPresetData {
  // Versión inicial: rechazar versiones desconocidas sin sobrescribirlas.
  if (
    !raw ||
    typeof raw !== 'object' ||
    !('version' in raw) ||
    raw.version !== 1 ||
    !('items' in raw) ||
    !Array.isArray(raw.items)
  ) {
    throw new Error('El formato de tus tamaños guardados no es compatible.');
  }
  if (raw.items.length > 100 || !raw.items.every(isSizePreset))
    throw new Error('Tus tamaños guardados contienen datos inválidos.');
  validatePresetRegistry(raw.items);
  if (!raw.items.every((p) => p.category === 'custom' && p.id.startsWith('user-')))
    throw new Error('Tus tamaños personales contienen datos inválidos.');
  return { version: 1, items: raw.items };
}
