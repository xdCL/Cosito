import { browserStorage, type LocalStore } from '../storage';
import { APP_CONFIG } from '../config/app';

export type Skin = 'cosito' | 'los-leones';
export const SKIN_KEY = 'cosito:skin';
export const SKINS = {
  cosito: {
    label: APP_CONFIG.name,
    title: APP_CONFIG.title,
    eyebrow: 'UN COSITO PARA TUS IDEAS GRANDES.',
    toolName: APP_CONFIG.name,
    themeColor: '#ff7c66',
  },
  'los-leones': {
    label: 'Escuela Los Leones',
    title: 'El cosito de Los Leones — Impresión en mosaico',
    eyebrow: 'EL COSITO DE ESCUELA LOS LEONES.',
    toolName: 'el cosito de Los Leones',
    themeColor: '#0066cc',
  },
} as const;

export const parseSkin = (value: unknown): Skin => (value === 'los-leones' ? value : 'cosito');
export function loadSkin(store: LocalStore | undefined = browserStorage()): Skin {
  try {
    return parseSkin(store?.getItem(SKIN_KEY));
  } catch {
    return 'cosito';
  }
}
export function saveSkin(skin: Skin, store: LocalStore | undefined = browserStorage()): boolean {
  try {
    if (!store) return false;
    store.setItem(SKIN_KEY, skin);
    return true;
  } catch {
    return false;
  }
}
