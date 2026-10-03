import { browserStorage, type LocalStore } from '../storage';
import { migrateUserPresets } from './migrations';
import type { SizePreset } from './types';
export const USER_PRESETS_KEY = 'cosito:user-size-presets';
export function loadUserPresets(store: LocalStore | undefined = browserStorage()): {
  items: SizePreset[];
  error?: string;
} {
  try {
    const raw = store?.getItem(USER_PRESETS_KEY);
    return { items: raw ? migrateUserPresets(JSON.parse(raw)).items : [] };
  } catch {
    return {
      items: [],
      error: 'No pudimos leer tus tamaños guardados. Los datos originales se conservaron.',
    };
  }
}
export function saveUserPresets(
  items: SizePreset[],
  store: LocalStore | undefined = browserStorage(),
): void {
  if (!store) throw new Error('El navegador no permite guardar tamaños en este dispositivo.');
  const data = migrateUserPresets({ version: 1, items });
  const existing = store.getItem(USER_PRESETS_KEY);
  // No destruir datos corruptos ni datos de una versión futura.
  if (existing) migrateUserPresets(JSON.parse(existing));
  store.setItem(USER_PRESETS_KEY, JSON.stringify(data));
}
export function createUserPreset(name: string, widthMm: number, heightMm: number): SizePreset {
  const preset: SizePreset = {
    id: `user-${crypto.randomUUID()}`,
    name: name.trim(),
    widthMm,
    heightMm,
    category: 'custom',
    enabled: true,
  };
  migrateUserPresets({ version: 1, items: [preset] });
  return preset;
}
export function renameUserPreset(items: SizePreset[], id: string, name: string): SizePreset[] {
  const next = items.map((p) => (p.id === id ? { ...p, name: name.trim() } : p));
  migrateUserPresets({ version: 1, items: next });
  return next;
}
export const deleteUserPreset = (items: SizePreset[], id: string) =>
  items.filter((p) => p.id !== id);
