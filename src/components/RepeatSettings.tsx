import { PIECE_PRESETS, type RepeatConfig } from '../app/repeat-configuration';

export function RepeatSettings({
  value,
  change,
  busy,
}: {
  value: RepeatConfig;
  change: (patch: Partial<RepeatConfig>) => void;
  busy: boolean;
}) {
  return (
    <fieldset class="repeat-settings" disabled={busy}>
      <legend class="sr-only">Tamaño de pieza y cantidad</legend>
      <label>
        Formato de pieza
        <select
          value={value.preset}
          onChange={(event) => {
            const preset = event.currentTarget.value as RepeatConfig['preset'];
            const size = preset === 'custom' ? undefined : PIECE_PRESETS[preset];
            change(size ? { preset, width: size.width, height: size.height } : { preset });
          }}
        >
          {Object.entries(PIECE_PRESETS).map(([id, preset]) => (
            <option key={id} value={id}>
              {preset.label}
            </option>
          ))}
          <option value="custom">Personalizado</option>
        </select>
      </label>
      <div class="repeat-fields">
        {(['width', 'height'] as const).map((key) => {
          const label = key === 'width' ? 'Ancho de la pieza' : 'Alto de la pieza';
          return (
            <label key={key}>
              {label}
              <span class="unit-input">
                <input
                  aria-label={label}
                  inputMode="decimal"
                  value={value[key]}
                  onInput={(e) => change({ preset: 'custom', [key]: e.currentTarget.value })}
                />
                <span>cm</span>
              </span>
            </label>
          );
        })}
      </div>
      <div class="repeat-fields">
        <label>
          Separación entre piezas
          <span class="unit-input">
            <input
              aria-label="Separación entre piezas"
              inputMode="decimal"
              value={value.gap}
              onInput={(e) => change({ gap: e.currentTarget.value })}
            />
            <span>mm</span>
          </span>
        </label>
        <label>
          Copias por hoja
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Máximo"
            value={value.perSheet}
            onInput={(e) => change({ perSheet: e.currentTarget.value })}
          />
        </label>
      </div>
      <p class="section-note">
        Deja «Copias por hoja» vacío para aprovechar la cuadrícula al máximo.
      </p>
      <div class="repeat-fields">
        <label>
          Plan de impresión
          <select
            value={value.run}
            onChange={(e) => change({ run: e.currentTarget.value as RepeatConfig['run'] })}
          >
            <option value="sheets">Llenar hojas</option>
            <option value="copies">Cantidad total</option>
          </select>
        </label>
        {value.run === 'sheets' ? (
          <label>
            Hojas a llenar
            <input
              type="number"
              min="1"
              step="1"
              value={value.sheets}
              onInput={(e) => change({ sheets: e.currentTarget.value })}
            />
          </label>
        ) : (
          <label>
            Cantidad total de copias
            <input
              type="number"
              min="1"
              step="1"
              value={value.copies}
              onInput={(e) => change({ copies: e.currentTarget.value })}
            />
          </label>
        )}
      </div>
      <label class="check-label">
        <input
          type="checkbox"
          checked={value.allowRotation}
          onChange={(e) => change({ allowRotation: e.currentTarget.checked })}
        />
        Permitir un giro de 90° para que quepan más piezas
      </label>
      <label class="check-label">
        <input
          type="checkbox"
          checked={value.cutGuides}
          onChange={(e) => change({ cutGuides: e.currentTarget.checked })}
        />
        Imprimir líneas de corte alrededor de las piezas
      </label>
    </fieldset>
  );
}
