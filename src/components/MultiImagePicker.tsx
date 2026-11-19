import { useRef, useState } from 'preact/hooks';
import type { ImageAdjustment, ImageFit } from '../core/image-fit';
import type { MultiPiece } from '../app/multi-images';

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

export function MultiImagePicker({
  pieces,
  busy,
  add,
  replace,
  remove,
  reorder,
  adjust,
}: {
  pieces: MultiPiece[];
  busy: boolean;
  add: (files: File[]) => void;
  replace: (index: number, file: File) => void;
  remove: (index: number) => void;
  reorder: (from: number, to: number) => void;
  adjust: (index: number, patch: Partial<ImageAdjustment>) => void;
}) {
  const upload = useRef<HTMLInputElement>(null);
  const [dragged, setDragged] = useState<number | null>(null);
  return (
    <div class="multi-picker">
      <div
        class="drop-zone multi-drop-zone"
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (!busy && event.dataTransfer?.files.length) add(Array.from(event.dataTransfer.files));
        }}
      >
        <p>
          <strong>Una imagen diferente por credencial</strong>
        </p>
        <button type="button" disabled={busy} onClick={() => upload.current?.click()}>
          + {pieces.length ? 'Agregar más imágenes' : 'Seleccionar varias imágenes'}
        </button>
        <p>Selecciona varias a la vez o arrástralas aquí. Se asignarán en orden.</p>
        <small>JPG, PNG o WEBP · hasta 100 imágenes y 250 MB en total.</small>
        <input
          ref={upload}
          class="sr-only"
          type="file"
          multiple
          accept={ACCEPT}
          aria-label="Seleccionar imágenes para credenciales"
          disabled={busy}
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = '';
            if (files.length) add(files);
          }}
        />
      </div>
      {pieces.length > 0 && (
        <>
          <p class="section-note" role="status">
            {pieces.length} {pieces.length === 1 ? 'imagen asignada' : 'imágenes asignadas'}. Una
            credencial por imagen; si faltan espacios en la última hoja, quedarán vacíos.
          </p>
          <ol class="multi-pieces">
            {pieces.map((piece, index) => (
              <li
                class="multi-piece"
                key={piece.id}
                draggable={!busy}
                onDragStart={() => setDragged(index)}
                onDragEnd={() => setDragged(null)}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (busy) return;
                  if (event.dataTransfer?.files.length) {
                    add(Array.from(event.dataTransfer.files));
                  } else if (dragged !== null) {
                    reorder(dragged, index);
                  }
                  setDragged(null);
                }}
              >
                <div class="multi-piece-heading">
                  <strong>Credencial {index + 1}</strong>
                  <span title={piece.image.file.name}>{piece.image.file.name}</span>
                </div>
                <img src={piece.image.previewUrl} alt={'Imagen de credencial ' + (index + 1)} />
                <div class="multi-piece-controls">
                  <label>
                    Ajuste
                    <select
                      disabled={busy}
                      value={piece.adjustment.fit}
                      onChange={(event) =>
                        adjust(index, { fit: event.currentTarget.value as ImageFit })
                      }
                    >
                      <option value="contain">Encajar</option>
                      <option value="cover">Cubrir</option>
                      <option value="stretch">Estirar</option>
                    </select>
                  </label>
                  <label>
                    Posición horizontal
                    <select
                      disabled={busy}
                      value={piece.adjustment.alignX}
                      onChange={(event) =>
                        adjust(index, {
                          alignX: event.currentTarget.value as ImageAdjustment['alignX'],
                        })
                      }
                    >
                      <option value="start">Izquierda</option>
                      <option value="center">Centro</option>
                      <option value="end">Derecha</option>
                    </select>
                  </label>
                  <label>
                    Posición vertical
                    <select
                      disabled={busy}
                      value={piece.adjustment.alignY}
                      onChange={(event) =>
                        adjust(index, {
                          alignY: event.currentTarget.value as ImageAdjustment['alignY'],
                        })
                      }
                    >
                      <option value="start">Arriba</option>
                      <option value="center">Centro</option>
                      <option value="end">Abajo</option>
                    </select>
                  </label>
                </div>
                <div class="multi-piece-actions">
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    aria-label={'Mover credencial ' + (index + 1) + ' hacia atrás'}
                    onClick={() => reorder(index, index - 1)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={busy || index === pieces.length - 1}
                    aria-label={'Mover credencial ' + (index + 1) + ' hacia adelante'}
                    onClick={() => reorder(index, index + 1)}
                  >
                    →
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={'Girar credencial ' + (index + 1)}
                    onClick={() =>
                      adjust(index, {
                        rotation: ((piece.adjustment.rotation + 90) %
                          360) as ImageAdjustment['rotation'],
                      })
                    }
                  >
                    Girar ↻
                  </button>
                  <label class="multi-replace">
                    Reemplazar
                    <input
                      class="sr-only"
                      disabled={busy}
                      type="file"
                      accept={ACCEPT}
                      aria-label={'Reemplazar imagen de credencial ' + (index + 1)}
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        event.currentTarget.value = '';
                        if (file) replace(index, file);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={'Eliminar credencial ' + (index + 1)}
                    onClick={() => remove(index)}
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
