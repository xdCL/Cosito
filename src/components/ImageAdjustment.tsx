import type {
  ImageAdjustment as Adjustment,
  ImageAlignment,
  ImageFit,
  ImageRotation,
} from '../core/image-fit';

export function ImageAdjustment({
  value,
  change,
  busy,
}: {
  value: Adjustment;
  change: (value: Adjustment) => void;
  busy: boolean;
}) {
  const rotate = (degrees: 90 | -90) =>
    change({ ...value, rotation: ((value.rotation + degrees + 360) % 360) as ImageRotation });
  return (
    <fieldset class="image-adjustment" disabled={busy} aria-describedby="image-adjustment-help">
      <legend>Ajustar imagen</legend>
      <p id="image-adjustment-help" class="section-note">
        Los ajustes se aplican al lienzo completo, antes de dividirlo en hojas.
      </p>
      <div class="image-adjustment-actions">
        <button type="button" aria-label="Girar 90° a la izquierda" onClick={() => rotate(-90)}>
          <span aria-hidden="true">↶ 90°</span>
        </button>
        <button type="button" aria-label="Girar 90° a la derecha" onClick={() => rotate(90)}>
          <span aria-hidden="true">↷ 90°</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (value.alignX !== 'center' || value.alignY !== 'center')
              change({ ...value, alignX: 'center', alignY: 'center' });
          }}
        >
          Centrar imagen
        </button>
        <output class="image-rotation" aria-live="polite">
          Giro: {value.rotation}°
        </output>
      </div>
      <label>
        Ajuste de la imagen
        <select
          value={value.fit}
          onChange={(e) => change({ ...value, fit: e.currentTarget.value as ImageFit })}
        >
          <option value="contain">Ver imagen completa</option>
          <option value="cover">Cubrir todo</option>
          <option value="stretch">Ajustar exacto</option>
        </select>
      </label>
      {value.fit === 'stretch' ? (
        <p class="section-note">Esta opción puede modificar las proporciones de la imagen.</p>
      ) : (
        <>
          <div class="image-alignment">
            <label>
              Posición horizontal
              <select
                value={value.alignX}
                onChange={(e) =>
                  change({ ...value, alignX: e.currentTarget.value as ImageAlignment })
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
                value={value.alignY}
                onChange={(e) =>
                  change({ ...value, alignY: e.currentTarget.value as ImageAlignment })
                }
              >
                <option value="start">Arriba</option>
                <option value="center">Centro</option>
                <option value="end">Abajo</option>
              </select>
            </label>
          </div>
          {value.fit === 'cover' && (
            <p class="section-note">
              Cambia la posición para elegir qué parte queda en el recorte.
            </p>
          )}
        </>
      )}
    </fieldset>
  );
}
