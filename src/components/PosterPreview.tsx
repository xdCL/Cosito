import { useEffect, useRef, useState } from 'preact/hooks';
import type { Layout } from '../core/tiling';
import { imageTransform, placeImage, type ImageAdjustment } from '../core/image-fit';
import { LIMITS } from '../config/limits';
import type { LoadedImage } from '../image/decode-image';
export function PosterPreview({
  image,
  layout,
  adjustment,
}: {
  image: LoadedImage | null;
  layout: Layout;
  adjustment: ImageAdjustment;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [thumbnail, setThumbnail] = useState<{ source: HTMLImageElement; url: string }>();
  const { posterWidthMm, posterHeightMm } = layout;
  const scale = LIMITS.maxPreviewSide / Math.max(posterWidthMm, posterHeightMm);
  const width = Math.max(1, Math.round(posterWidthMm * scale));
  const height = Math.max(1, Math.round(posterHeightMm * scale));
  useEffect(() => {
    if (!image) return;
    const source = new Image();
    source.onload = () => setThumbnail({ source, url: image.previewUrl });
    source.src = image.previewUrl;
    return () => {
      source.onload = null;
      source.src = '';
    };
  }, [image]);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.resetTransform();
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    if (!image || thumbnail?.url !== image.previewUrl) return;
    const fitted = placeImage(image.width, image.height, posterWidthMm, posterHeightMm, adjustment);
    ctx.scale(width / posterWidthMm, height / posterHeightMm);
    ctx.transform(...imageTransform(fitted, adjustment.rotation));
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(thumbnail.source, 0, 0, 1, 1);
  }, [image, thumbnail, posterWidthMm, posterHeightMm, width, height, adjustment]);
  return (
    <figure class="preview-figure">
      <div
        class="poster"
        style={{
          aspectRatio: `${layout.posterWidthMm} / ${layout.posterHeightMm}`,
          width: `min(100%, ${Math.min(245, (420 * layout.posterWidthMm) / layout.posterHeightMm)}px)`,
        }}
      >
        <canvas
          ref={ref}
          width={width}
          height={height}
          aria-label="Vista previa de la imagen a su proporción final"
        />
        <div class="tile-overlay" aria-hidden="true">
          {layout.tiles.map((tile) => {
            const r = tile.posterRectMm;
            return (
              <div
                class="preview-tile"
                key={tile.index}
                style={{
                  left: `${(r.x / layout.posterWidthMm) * 100}%`,
                  top: `${(r.y / layout.posterHeightMm) * 100}%`,
                  width: `${(r.width / layout.posterWidthMm) * 100}%`,
                  height: `${(r.height / layout.posterHeightMm) * 100}%`,
                }}
              >
                {tile.overlap.left > 0 && (
                  <i
                    class="overlap-band vertical"
                    style={{ width: `${(tile.overlap.left / r.width) * 100}%` }}
                  />
                )}
                {tile.overlap.top > 0 && (
                  <i
                    class="overlap-band horizontal"
                    style={{ height: `${(tile.overlap.top / r.height) * 100}%` }}
                  />
                )}
                <span>
                  {tile.index + 1}
                  <small>{tile.label}</small>
                </span>
              </div>
            );
          })}
        </div>
        {!image && <div class="preview-placeholder">Tu imagen aparecerá aquí</div>}
      </div>
      <figcaption>Guía de montaje · Las franjas muestran el contenido repetido.</figcaption>
      <details class="assembly-list">
        <summary>Ver orden de las hojas</summary>
        <ol>
          {layout.tiles.map((tile) => (
            <li key={tile.index}>
              Hoja {tile.index + 1} · {tile.label}
              {tile.neighbours.right !== undefined
                ? ` → ${layout.tiles[tile.neighbours.right].label}`
                : ''}
              {tile.neighbours.bottom !== undefined
                ? ` ↓ ${layout.tiles[tile.neighbours.bottom].label}`
                : ''}
            </li>
          ))}
        </ol>
      </details>
    </figure>
  );
}
