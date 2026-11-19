import { useEffect, useRef, useState } from 'preact/hooks';

type UpdatePromptProps = {
  available: boolean;
  busy: boolean;
  hasWork: boolean;
  toolName: string;
  onUpdate: () => Promise<void>;
};

/** A real modal blocks the rest of the page until the user chooses what to do. */
export function UpdatePrompt({
  available,
  busy,
  hasWork,
  toolName,
  onUpdate,
}: UpdatePromptProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [deferred, setDeferred] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!available) {
      setDeferred(false);
      setError('');
    }
  }, [available]);

  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;
    const shouldOpen = available && !deferred && !busy;
    if (shouldOpen && !modal.open) modal.showModal();
    if (!shouldOpen && modal.open) modal.close();
  }, [available, deferred, busy]);

  async function applyUpdate() {
    if (busy || updating) return;
    setError('');
    setUpdating(true);
    try {
      await onUpdate();
    } catch {
      setError('No pudimos completar la actualización. Revisa tu conexión y vuelve a intentarlo.');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      <dialog
        ref={dialog}
        class="update-dialog"
        aria-labelledby="update-dialog-title"
        aria-describedby="update-dialog-description"
        onCancel={(event) => event.preventDefault()}
      >
        <div class="update-dialog-symbol" aria-hidden="true">
          ↻
        </div>
        <p class="eyebrow">ACTUALIZACIÓN DISPONIBLE</p>
        <h2 id="update-dialog-title">¡Hay una nueva versión de {toolName}!</h2>
        <p id="update-dialog-description">
          Encontramos mejoras listas para instalar. Actualiza para usar la versión más reciente.
        </p>
        {hasWork && (
          <p class="update-dialog-warning">
            Tienes un proyecto abierto. Al actualizar se cerrarán las imágenes y los PDF de esta
            sesión. Descarga tu PDF antes de actualizar o elige seguir trabajando.
          </p>
        )}
        {error && <p class="error" role="alert">{error}</p>}
        <div class="update-dialog-actions">
          <button
            type="button"
            class="primary"
            disabled={updating || busy}
            onClick={() => void applyUpdate()}
            autoFocus={!hasWork}
          >
            {updating ? 'Actualizando…' : 'Actualizar ahora'}
          </button>
          <button
            type="button"
            disabled={updating}
            autoFocus={hasWork}
            onClick={() => setDeferred(true)}
          >
            Seguir trabajando
          </button>
        </div>
        <p class="update-dialog-footnote">
          La actualización es gratuita y no envía tus imágenes a ningún servidor.
        </p>
      </dialog>
      {available && deferred && (
        <aside class="update-reminder" role="status">
          <span>Hay una actualización de {toolName} pendiente.</span>
          <button
            type="button"
            class="text-button"
            disabled={busy}
            onClick={() => setDeferred(false)}
          >
            Ver actualización
          </button>
        </aside>
      )}
    </>
  );
}
