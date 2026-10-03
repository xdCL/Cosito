import { useEffect, useRef } from 'preact/hooks';
import type { Layout } from '../core/tiling';
import { fitImage, type ImageFit } from '../core/image-fit';
import { LIMITS } from '../config/limits';
import type { LoadedImage } from '../image/decode-image';
export function PosterPreview({
  image,
  layout,
  fit,
}: {
  image: LoadedImage | null;
  layout: Layout;
  fit: ImageFit;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    const canvas = ref.current;
    if (!canvas) return;
    const scale = Math.min(
      LIMITS.maxPreviewSide / layout.posterWidthMm,
      LIMITS.maxPreviewSide / layout.posterHeightMm,
    );
    canvas.width = Math.max(1, Math.round(layout.posterWidthMm * scale));
    canvas.height = Math.max(1, Math.round(layout.posterHeightMm * scale));
    const draw = (source?: HTMLImageElement) => {
      if (cancelled) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (source && image) {
        const r = fitImage(image.width, image.height, canvas.width, canvas.height, fit);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, r.x, r.y, r.width, r.height);
      }
    };
    draw();
    const img = new Image();
    if (image) {
      img.onload = () => draw(img);
      img.src = image.previewUrl;
    }
    return () => {
      cancelled = true;
      img.onload = null;
      img.src = '';
      canvas.width = 1;
      canvas.height = 1;
    };
  }, [image, layout, fit]);
  return (
    <figure class="preview-figure">
      <div
        class="poster"
        style={{
          aspectRatio: `${layout.posterWidthMm} / ${layout.posterHeightMm}`,
          width: `min(100%, ${Math.min(245, (420 * layout.posterWidthMm) / layout.posterHeightMm)}px)`,
        }}
      >
        <canvas ref={ref} aria-label="Vista previa de la imagen a su proporción final" />
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
