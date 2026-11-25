import { numeric, type Config, type ChangeConfig } from '../app/configuration';
import { MAX_SHEETS } from '../core/validation';
import { sheetDistributions } from '../core/sheet-layout';

export function SheetSettings({
  config,
  change,
  busy,
}: {
  config: Config;
  change: ChangeConfig;
  busy: boolean;
}) {
  const grids = sheetDistributions(numeric(config.sheets));
  return (
    <fieldset class="sheet-settings" disabled={busy}>
      <legend>¿En cuántas hojas quieres imprimir tu imagen?</legend>
      <label>
        Cantidad de hojas
        <input
          type="number"
          min="1"
          max={MAX_SHEETS}
          step="1"
          value={config.sheets}
          onInput={(e) => change('sheets', e.currentTarget.value)}
        />
      </label>
      <div class="sheet-field">
        <label for="sheet-distribution">Distribución del mosaico</label>
        <select
          id="sheet-distribution"
          value={config.sheetColumns}
          onChange={(e) => change('sheetColumns', e.currentTarget.value)}
        >
          <option value="auto">Recomendada para mi imagen</option>
          {grids.map(({ columns, rows }) => (
            <option key={columns} value={String(columns)}>
              {columns} {columns === 1 ? 'columna' : 'columnas'} × {rows}{' '}
              {rows === 1 ? 'fila' : 'filas'}
              {rows > columns ? ' · Vertical' : columns > rows ? ' · Horizontal' : ''}
            </option>
          ))}
        </select>
      </div>
      <div class="sheet-field">
        <label for="sheet-orientation">Orientación de las hojas</label>
        <select
          id="sheet-orientation"
          value={config.orientation}
          onChange={(e) => change('orientation', e.currentTarget.value as Config['orientation'])}
        >
          <option value="auto">Automática para mi imagen</option>
          <option value="portrait">Vertical</option>
          <option value="landscape">Horizontal</option>
        </select>
      </div>
      <p class="section-note">
        La cantidad corresponde al mosaico completo. El tamaño final se calcula según tu papel,
        margen y solape. Se conservan todas las hojas, incluso si alguna queda en blanco. Puedes
        ajustar la imagen en la vista previa para dejar bordes o llenar el mosaico.
      </p>
    </fieldset>
  );
}
