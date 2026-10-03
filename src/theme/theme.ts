import { browserStorage, type LocalStore } from '../storage';
export type Theme = 'system' | 'light' | 'dark';
export const THEME_KEY = 'cosito:theme';
export const parseTheme = (value: unknown): Theme =>
  value === 'light' || value === 'dark' ? value : 'system';
export function loadTheme(store: LocalStore | undefined = browserStorage()): Theme {
  try {
    return parseTheme(store?.getItem(THEME_KEY));
  } catch {
    return 'system';
  }
}
export function saveTheme(theme: Theme, store: LocalStore | undefined = browserStorage()): boolean {
  try {
    if (!store) return false;
    store.setItem(THEME_KEY, theme);
    return true;
  } catch {
    return false;
  }
}
