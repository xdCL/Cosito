import type { Layout } from '../core/tiling';
import { formatSize } from '../core/units';
export function ResultSummary({
  hasImage,
  layout,
  paperName,
  showValidation,
  error,
  omitted,
}: {
  hasImage: boolean;
  layout: Layout | null;
  paperName: string;
  showValidation: boolean;
  error: string;
  omitted: number;
}) {
  return (
    <div class="result-summary" aria-live="polite">
      <p class="eyebrow">ASÍ QUEDARÁ TU PROYECTO</p>
      <h2 id="result-title">
        {hasImage && layout ? 'Tu mosaico está listo' : 'Un proyecto a tu medida'}
      </h2>
      {layout ? (
        <>
          <p class="sheet-count">
            <strong>{layout.sheetCount}</strong> {layout.sheetCount === 1 ? 'hoja' : 'hojas'}
          </p>
          <p class="layout-description">
            {paperName} {layout.orientation === 'landscape' ? 'horizontal' : 'vertical'}
            <br />
            <strong>
              {layout.columns} columnas × {layout.rows} filas
            </strong>
          </p>
          {omitted > 0 && (
            <p class="savings">
              {omitted === 1
                ? 'Se omite 1 hoja sin contenido'
                : `Se omiten ${omitted} hojas sin contenido`}
              .
            </p>
          )}
          <p class="finished-size">
            Tamaño terminado:{' '}
            <strong>{formatSize(layout.posterWidthMm, layout.posterHeightMm)}</strong>
          </p>
          {layout.alternativeSheetCount && layout.alternativeSheetCount > layout.sheetCount && (
            <p class="savings">
              En {layout.orientation === 'landscape' ? 'vertical' : 'horizontal'} serían{' '}
              {layout.alternativeSheetCount} hojas.
            </p>
          )}
        </>
      ) : (
        <p class={showValidation ? 'error' : 'section-note'} id="config-error">
          {showValidation ? error : 'Completa tus medidas para ver el mosaico.'}
        </p>
      )}
    </div>
  );
}
