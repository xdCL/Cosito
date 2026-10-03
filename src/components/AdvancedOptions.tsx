import type { Config, ChangeConfig } from '../app/configuration';
import { numeric } from '../app/configuration';
import { LIMITS } from '../config/limits';
import type { ImageFit } from '../core/image-fit';
import type { Layout, Orientation } from '../core/tiling';
export function AdvancedOptions({
  config,
  change,
  busy,
  quality,
  layout,
}: {
  config: Config;
  change: ChangeConfig;
  busy: boolean;
  quality: number;
  layout: Layout | null;
}) {
  return (
    <details class="advanced" id="opciones">
      <summary>
        Opciones avanzadas <span>Todo lo esencial ya está configurado.</span>
      </summary>
      <fieldset disabled={busy}>
        <legend class="sr-only">Opciones de impresión</legend>
        <div class="advanced-grid">
          <label>
            Ajuste de la imagen
            <select
              value={config.fit}
              onChange={(e) => change('fit', e.currentTarget.value as ImageFit)}
            >
              <option value="contain">Ver imagen completa</option>
              <option value="cover">Cubrir todo</option>
              <option value="stretch">Ajustar exacto</option>
            </select>
          </label>
          <label>
            Orientación
            <select
              value={config.orientation}
              onChange={(e) => change('orientation', e.currentTarget.value as Orientation)}
            >
              <option value="auto">Usar menos hojas</option>
              <option value="portrait">Vertical</option>
              <option value="landscape">Horizontal</option>
            </select>
          </label>
          <label>
            Margen seguro (mm)
            <input
              type="number"
              min="0"
              step="0.5"
              value={config.margin}
              onInput={(e) => change('margin', e.currentTarget.value)}
            />
          </label>
          <label>
            Solape: contenido repetido (mm)
            <input
              type="number"
              min="0"
              step="0.5"
              value={config.overlap}
              list="overlap-values"
              onInput={(e) => change('overlap', e.currentTarget.value)}
            />
            <datalist id="overlap-values">
              {[0, 3, 5, 10].map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </label>
          <label>
            Calidad
            <select
              value={config.dpi}
              onChange={(e) => change('dpi', Number(e.currentTarget.value) as Config['dpi'])}
            >
              <option value="150">Rápida · 150 ppp</option>
              <option value="200">Recomendada · 200 ppp</option>
              <option value="300">Alta · 300 ppp</option>
            </select>
          </label>
        </div>
        {config.fit === 'stretch' && (
          <p class="warning">Esta opción puede modificar las proporciones de la imagen.</p>
        )}
        {config.fit === 'cover' && <p>Se recortan bordes para cubrir todo el tamaño.</p>}
        {quality > 0 && (
          <p>
            Calidad estimada: {quality} ppp
            {quality < 100
              ? '. Esta imagen puede verse pixelada al imprimirla en este tamaño.'
              : '.'}
          </p>
        )}
        {layout &&
          (layout.sheetCount >= LIMITS.warningPages ||
            (config.dpi === 300 && layout.sheetCount > 20)) && (
            <p class="warning">
              Este PDF puede requerir bastante memoria.{' '}
              <button type="button" class="text-button" onClick={() => change('dpi', 200)}>
                Usar calidad recomendada
              </button>
            </p>
          )}
        <p class="section-note">
          El solape ayuda a unir las hojas y conserva el tamaño final. La resolución se limita en
          equipos modestos; subir la calidad no agrega detalles a la imagen original.
        </p>
        {numeric(config.margin) < 3 && (
          <p class="warning">
            Con menos de 3 mm, algunas marcas y referencias se omiten para proteger la imagen. Con
            margen 0, tu impresora debe admitir impresión sin bordes.
          </p>
        )}
        {(['cropMarks', 'alignmentMarks', 'guide', 'calibration'] as const).map((key, i) => (
          <label class="check-label" key={key}>
            <input
              type="checkbox"
              checked={config[key]}
              onChange={(e) => change(key, e.currentTarget.checked)}
            />
            {
              [
                'Marcas de corte',
                'Marcas de alineación',
                'Incluir guía de montaje en PDF (+1 hoja)',
                'Incluir página de calibración (+1 hoja)',
              ][i]
            }
          </label>
        ))}
      </fieldset>
    </details>
  );
}
