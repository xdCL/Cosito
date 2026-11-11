import { useState } from 'preact/hooks';
import { imageTransform, placeImage, type ImageAdjustment } from '../core/image-fit';
import { placeCopy, type RepeatLayout } from '../core/repetition';
import { formatSize } from '../core/units';
import type { LoadedImage } from '../image/decode-image';

export function RepeatSummary({
  layout,
  error,
  paperName,
}: {
  layout: RepeatLayout | null;
  error: string;
  paperName: string;
}) {
  return (
    <div class="result-summary" aria-live="polite">
      <p class="eyebrow">ASÍ QUEDARÁ TU TIRADA</p>
      <h2 id="result-title">Tus hojas de repeticiones</h2>
      {layout ? (
        <>
          <p class="sheet-count">
            <strong>{layout.sheetCount}</strong> {layout.sheetCount === 1 ? 'hoja' : 'hojas'}
          </p>
          <p class="repeat-count">
            {layout.copies} {layout.copies === 1 ? 'copia' : 'copias'} · {layout.slots.length} por
            hoja
            {layout.sheetCount > 1 && layout.lastSheetCount < layout.perSheet
              ? ` · ${layout.lastSheetCount} en la última`
              : ''}
          </p>
          <p class="finished-size">
            {paperName} {layout.orientation === 'portrait' ? 'vertical' : 'horizontal'} · Máximo:{' '}
            {layout.capacity} por hoja
            <br />
            Cada pieza: <strong>{formatSize(layout.widthMm, layout.heightMm, 3)}</strong>
            {layout.rotated ? ' (girada en la hoja)' : ''}
          </p>
        </>
      ) : (
        <p class="error">{error}</p>
      )}
    </div>
  );
}

export function RepeatPreview({
  image,
  layout,
  adjustment,
  cutGuides,
}: {
  image: LoadedImage | null;
  layout: RepeatLayout;
  adjustment: ImageAdjustment;
  cutGuides: boolean;
}) {
  const [last, setLast] = useState(false);
  const hasPartial = layout.sheetCount > 1 && layout.lastSheetCount < layout.perSheet;
  const count = hasPartial && last ? layout.lastSheetCount : layout.slots.length;
  const fitted =
    image && placeImage(image.width, image.height, layout.widthMm, layout.heightMm, adjustment);
  return (
    <figure class="preview-figure repeat-preview">
      {hasPartial && (
        <label class="repeat-preview-selector">
          Vista de la hoja
          <select
            value={last ? 'last' : 'first'}
            onChange={(e) => setLast(e.currentTarget.value === 'last')}
          >
            <option value="first">Primera hoja</option>
            <option value="last">Última hoja</option>
          </select>
        </label>
      )}
      <svg
        class="repeat-paper"
        style={{
          width: `min(100%, ${Math.min(320, (420 * layout.paperWidthMm) / layout.paperHeightMm)}px)`,
        }}
        role="img"
        aria-label={`Vista previa de una hoja con ${count} ${count === 1 ? 'copia' : 'copias'}`}
        viewBox={`0 0 ${layout.paperWidthMm} ${layout.paperHeightMm}`}
      >
        {image && (
          <defs>
            <image
              id="repeat-artwork"
              href={image.previewUrl}
              width="1"
              height="1"
              preserveAspectRatio="none"
            />
          </defs>
        )}
        {layout.slots.slice(0, count).map((slot, index) => {
          const local = { ...slot, x: 0, y: 0 };
          const copy = fitted && placeCopy(layout, local, fitted, adjustment.rotation);
          return (
            <svg
              key={index}
              class="repeat-piece"
              x={slot.x}
              y={slot.y}
              width={slot.width}
              height={slot.height}
              overflow="hidden"
            >
              {copy && (
                <use
                  href="#repeat-artwork"
                  transform={`matrix(${imageTransform(copy.rect, copy.rotation).join(' ')})`}
                />
              )}
              <rect
                width={slot.width}
                height={slot.height}
                fill="none"
                stroke="#8c7a97"
                strokeWidth="0.8"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          );
        })}
      </svg>
      <figcaption>
        {!image
          ? 'Agrega tu imagen para ver cómo queda en cada pieza.'
          : cutGuides
            ? 'El PDF incluye líneas de corte alrededor de cada pieza.'
            : 'Los contornos son solo una referencia de la vista previa.'}
      </figcaption>
    </figure>
  );
}
