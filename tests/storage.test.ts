import { describe, expect, it } from 'vitest';
import { BUILTIN_SIZE_PRESETS } from '../src/config/builtin-presets';
import {
  enabledPresets,
  isSizePreset,
  presetDimensions,
  validatePresetRegistry,
} from '../src/presets/validation';
import {
  createUserPreset,
  deleteUserPreset,
  loadUserPresets,
  renameUserPreset,
  saveUserPresets,
  USER_PRESETS_KEY,
} from '../src/presets/user-presets';
import { loadTheme, parseTheme, saveTheme, THEME_KEY } from '../src/theme/theme';
import { calculateLayout } from '../src/core/tiling';
import { pdfFilename } from '../src/utils/filename';
const memoryStore = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
    removeItem: (k: string) => {
      data.delete(k);
    },
  };
};
describe('presets', () => {
  it('registro válido, IDs únicos y selección equivalente a entrada manual', () => {
    expect(() => validatePresetRegistry(BUILTIN_SIZE_PRESETS)).not.toThrow();
    for (const preset of enabledPresets(BUILTIN_SIZE_PRESETS)) {
      const base = {
        paperWidthMm: 215.9,
        paperHeightMm: 279.4,
        marginMm: 5,
        overlapMm: 5,
        orientation: 'auto' as const,
      };
      expect(calculateLayout({ ...base, ...presetDimensions(preset) })).toEqual(
        calculateLayout({
          ...base,
          posterWidthMm: preset.widthMm,
          posterHeightMm: preset.heightMm,
        }),
      );
    }
    expect(enabledPresets([{ ...BUILTIN_SIZE_PRESETS[0], enabled: false }])).toEqual([]);
    expect(() =>
      validatePresetRegistry([BUILTIN_SIZE_PRESETS[0], BUILTIN_SIZE_PRESETS[0]]),
    ).toThrow();
    for (const v of [NaN, Infinity, 0, -1])
      expect(isSizePreset({ ...BUILTIN_SIZE_PRESETS[0], widthMm: v })).toBe(false);
  });
  it('crear, renombrar, eliminar y persistir', () => {
    const store = memoryStore();
    const preset = createUserPreset(' Mi pizarra ', 1800, 1200);
    saveUserPresets([preset], store);
    expect(loadUserPresets(store).items[0].name).toBe('Mi pizarra');
    const renamed = renameUserPreset([preset], preset.id, 'Nuevo nombre');
    saveUserPresets(renamed, store);
    expect(loadUserPresets(store).items[0].name).toBe('Nuevo nombre');
    saveUserPresets(deleteUserPreset(renamed, preset.id), store);
    expect(loadUserPresets(store).items).toEqual([]);
  });
  it('datos corruptos y futuros no se pierden', () => {
    for (const raw of ['oops', '{"version":99,"items":[]}', '{"version":1,"items":[{}]}']) {
      const store = memoryStore();
      store.setItem(USER_PRESETS_KEY, raw);
      expect(loadUserPresets(store).error).toBeTruthy();
      expect(() => saveUserPresets([], store)).toThrow();
      expect(store.getItem(USER_PRESETS_KEY)).toBe(raw);
    }
  });
  it('almacenamiento restringido no rompe la lectura', () => {
    const store = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {},
    };
    expect(loadUserPresets(store).items).toEqual([]);
    expect(loadTheme(store)).toBe('system');
    expect(saveTheme('dark', store)).toBe(false);
  });
});
it('tema sistema por defecto, persistencia y valores inválidos', () => {
  const store = memoryStore();
  expect(loadTheme(store)).toBe('system');
  for (const t of ['light', 'dark', 'system'] as const) {
    expect(saveTheme(t, store)).toBe(true);
    expect(loadTheme(store)).toBe(t);
  }
  store.setItem(THEME_KEY, 'invalid');
  expect(loadTheme(store)).toBe('system');
  expect(parseTheme(null)).toBe('system');
});
it('nombre de descarga saneado', () =>
  expect(pdfFilename('../../Dibujo ♥.png', 500, 980, 'letter')).toBe(
    'dibujo-50x98cm-letter-cosito.pdf',
  ));
