import { useState } from 'preact/hooks';
import { imageTransform, placeImage, type ImageAdjustment } from '../core/image-fit';
import { placeCopy, type RepeatLayout } from '../core/repetition';
import { formatSize } from '../core/units';
import type { LoadedImage } from '../image/decode-image';
import type { MultiPiece } from '../app/multi-images';

export function RepeatSummary({
  layout,
  error,
  paperName,
  distinct = false,
}: {
  layout: RepeatLayout | null;
  error: string;
  paperName: string;
  distinct?: boolean;
}) {
  return (
    <div class="result-summary" aria-live="polite">
      <p class="eyebrow">ASÍ QUEDARÁ TU TIRADA</p>
      <h2 id="result-title">
        {distinct ? 'Tus hojas de credenciales' : 'Tus hojas de repeticiones'}
      </h2>
      {layout ? (
        <>
          <p class="sheet-count">
            <strong>{layout.sheetCount}</strong> {layout.sheetCount === 1 ? 'hoja' : 'hojas'}
          </p>
          <p class="repeat-count">
            {layout.copies}{' '}
            {distinct
              ? layout.copies === 1
                ? 'imagen'
                : 'imágenes'
              : layout.copies === 1
                ? 'copia'
                : 'copias'}{' '}
            · {layout.slots.length} por hoja
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
  pieces,
}: {
  image: LoadedImage | null;
  layout: RepeatLayout;
  adjustment: ImageAdjustment;
  cutGuides: boolean;
  pieces?: MultiPiece[];
}) {
  const [last, setLast] = useState(false);
  const hasPartial = layout.sheetCount > 1 && layout.lastSheetCount < layout.perSheet;
  const allowLast = pieces ? layout.sheetCount > 1 : hasPartial;
  const currentPage = allowLast && last ? layout.sheetCount - 1 : 0;
  const startIndex = currentPage * layout.perSheet;
  const count = currentPage === layout.sheetCount - 1 ? layout.lastSheetCount : layout.slots.length;
  return (
    <figure class="preview-figure repeat-preview">
      {allowLast && (
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
        {layout.slots.slice(0, count).map((slot, index) => {
          const piece = pieces?.[startIndex + index];
          const artwork = piece?.image ?? image;
          const adjustmentForPiece = piece?.adjustment ?? adjustment;
          const fitted =
            artwork &&
            placeImage(
              artwork.width,
              artwork.height,
              layout.widthMm,
              layout.heightMm,
              adjustmentForPiece,
            );
          const local = { ...slot, x: 0, y: 0 };
          const copy = fitted && placeCopy(layout, local, fitted, adjustmentForPiece.rotation);
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
              {copy && artwork && (
                <image
                  href={artwork.previewUrl}
                  width="1"
                  height="1"
                  preserveAspectRatio="none"
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
        {!(image || pieces?.length)
          ? 'Agrega imágenes para ver cómo queda cada pieza.'
          : cutGuides
            ? 'El PDF incluye líneas de corte alrededor de cada pieza.'
            : 'Los contornos son solo una referencia de la vista previa.'}
      </figcaption>
    </figure>
  );
}
