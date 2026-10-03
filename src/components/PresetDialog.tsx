import { useEffect, useRef, useState } from 'preact/hooks';
import { BUILTIN_SIZE_PRESETS } from '../config/builtin-presets';
import { formatSize } from '../core/units';
import { enabledPresets } from '../presets/validation';
import {
  createUserPreset,
  deleteUserPreset,
  loadUserPresets,
  renameUserPreset,
  saveUserPresets,
} from '../presets/user-presets';
import type { SizePreset } from '../presets/types';
export function PresetDialog({
  open,
  close,
  widthMm,
  heightMm,
  select,
}: {
  open: boolean;
  close: () => void;
  widthMm: number;
  heightMm: number;
  select: (p: SizePreset) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [loaded] = useState(loadUserPresets);
  const [items, setItems] = useState(loaded.items);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState(loaded.error || '');
  const canSaveSize =
    Number.isFinite(widthMm) && widthMm > 0 && Number.isFinite(heightMm) && heightMm > 0;
  useEffect(() => {
    if (open && !dialog.current?.open) {
      previousFocus.current = document.activeElement as HTMLElement;
      dialog.current?.showModal();
    }
    if (!open && dialog.current?.open) dialog.current?.close();
  }, [open]);
  function persist(next: SizePreset[]) {
    try {
      saveUserPresets(next);
      setItems(next);
      setError('');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar el tamaño.');
      return false;
    }
  }
  return (
    <dialog
      ref={dialog}
      onClose={() => {
        close();
        previousFocus.current?.focus();
      }}
      aria-labelledby="presets-title"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]',
          ),
        );
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <div class="dialog-head">
        <h2 id="presets-title">Un tamaño que ya conoces</h2>
        <button onClick={close} type="button">
          Cerrar
        </button>
      </div>
      <h3>Tamaños de Cosito</h3>
      <div class="preset-list">
        {enabledPresets(BUILTIN_SIZE_PRESETS).map((p) => (
          <button
            key={p.id}
            onClick={() => {
              select(p);
              close();
            }}
          >
            <strong>{p.name}</strong>
            <span>{formatSize(p.widthMm, p.heightMm)}</span>
          </button>
        ))}
      </div>
      <h3>Mis tamaños</h3>
      {!items.length && <p class="muted">Guarda las medidas que uses en tu sala, taller o casa.</p>}
      {items.map((p) => (
        <div class="user-preset" key={p.id}>
          <button
            onClick={() => {
              select(p);
              close();
            }}
          >
            <strong>{p.name}</strong>
            <span>{formatSize(p.widthMm, p.heightMm)}</span>
          </button>
          <div>
            <button
              aria-label={`Renombrar ${p.name}`}
              onClick={() => {
                setEditing(p.id);
                setName(p.name);
              }}
            >
              Renombrar
            </button>
            <button
              aria-label={`Eliminar ${p.name}`}
              onClick={() => persist(deleteUserPreset(items, p.id))}
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const next = editing
              ? renameUserPreset(items, editing, name)
              : [...items, createUserPreset(name, widthMm, heightMm)];
            if (persist(next)) {
              setName('');
              setEditing(null);
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Revisa el nombre y las medidas.');
          }
        }}
      >
        <label for="preset-name">
          {editing
            ? 'Nuevo nombre'
            : canSaveSize
              ? `Guardar ${formatSize(widthMm, heightMm)} como tamaño frecuente`
              : 'Nombre del tamaño frecuente'}
        </label>
        <input
          id="preset-name"
          value={name}
          onInput={(e) => setName(e.currentTarget.value)}
          placeholder="Por ejemplo: Panel de mi sala"
          required
          maxLength={80}
          disabled={!editing && !canSaveSize}
        />
        {!editing && !canSaveSize && (
          <p class="muted">Indica primero el ancho y el alto de tu proyecto para guardarlos.</p>
        )}
        <div class="button-row">
          <button
            class="primary"
            type="submit"
            disabled={!name.trim() || (!editing && !canSaveSize)}
          >
            {editing ? 'Guardar nombre' : 'Guardar tamaño'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setName('');
              }}
            >
              Cancelar cambio
            </button>
          )}
        </div>
      </form>
      {error && (
        <p role="alert" class="error">
          {error}
        </p>
      )}
      <p class="muted">Se guardan sólo en este navegador. Tu imagen nunca se guarda.</p>
    </dialog>
  );
}
