import { initial, numeric, type Config } from './configuration';
import { AdvancedOptions } from '../components/AdvancedOptions';
import { ResultSummary } from '../components/ResultSummary';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useRegisterSW } from 'virtual:pwa-register/preact';
import { APP_CONFIG } from '../config/app';
import { PAPERS } from '../config/papers';
import { calculateLayout } from '../core/tiling';
import { fitImage } from '../core/image-fit';
import { planRaster } from '../core/raster-plan';
import { formatNumber, formatSize } from '../core/units';
import { loadImage, type LoadedImage } from '../image/decode-image';
import { createPdf } from '../pdf/client';
import type { PdfOptions, Progress } from '../pdf/types';
import { pdfFilename } from '../utils/filename';
import { Header } from '../components/Header';
import { SectionNavigation } from '../components/SectionNavigation';
import { TypewriterWord } from '../components/TypewriterWord';
import { PosterPreview } from '../components/PosterPreview';
import { PresetDialog } from '../components/PresetDialog';
import { loadSkin, saveSkin, SKINS, type Skin } from '../theme/skin';
type AppStatus =
  | { kind: 'empty' | 'ready' }
  | { kind: 'generating'; progress: Progress }
  | { kind: 'completed'; url: string; filename: string; bytes: number }
  | { kind: 'error'; message: string };
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function App() {
  const [skin, setSkin] = useState(loadSkin);
  const [titlesAnimated, setTitlesAnimated] = useState(true);
  const brand = SKINS[skin];
  useEffect(() => {
    document.documentElement.dataset.skin = skin;
    document.title = brand.title;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', brand.themeColor);
    document
      .querySelector('link[rel="icon"]')
      ?.setAttribute(
        'href',
        `${import.meta.env.BASE_URL}icons/${skin === 'los-leones' ? 'school' : 'icon'}-192.png`,
      );
  }, [skin, brand]);
  function changeSkin(next: Skin) {
    document.documentElement.dataset.skin = next;
    setSkin(next);
    return saveSkin(next);
  }
  const [config, setConfig] = useState(initial);
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AppStatus>({ kind: 'empty' });
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadSequence = useRef(0);
  const [offlineMessage, setOfflineMessage] = useState('');
  const [offlineCached, setOfflineCached] = useState(false);
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () =>
      setOfflineMessage('La instalación sin conexión no está disponible en este navegador.'),
  });
  const generating = status.kind === 'generating';
  const busy = generating || loading;
  const paper = PAPERS.find((p) => p.id === config.paperId);
  const paperName = paper?.name || 'Papel personalizado';
  const calculation = useMemo(() => {
    try {
      return {
        layout: calculateLayout({
          posterWidthMm: numeric(config.width) * 10,
          posterHeightMm: numeric(config.height) * 10,
          paperWidthMm: paper?.widthMm ?? numeric(config.customWidth) * 10,
          paperHeightMm: paper?.heightMm ?? numeric(config.customHeight) * 10,
          marginMm: numeric(config.margin),
          overlapMm: numeric(config.overlap),
          orientation: config.orientation,
        }),
        error: '',
      };
    } catch (e) {
      return { layout: null, error: e instanceof Error ? e.message : 'Revisa las medidas.' };
    }
  }, [config, paper]);
  const layout = calculation.layout;
  const validateDimensions = showValidation && !!config.width.trim() && !!config.height.trim();
  useEffect(() => {
    let disposed = false;
    if ('serviceWorker' in navigator)
      void navigator.serviceWorker.ready.then(() => {
        if (!disposed) setOfflineCached(true);
      });
    return () => {
      disposed = true;
    };
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setShowValidation(true), 600);
    return () => window.clearTimeout(timer);
  }, [config]);
  useEffect(() => {
    const url = image?.previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [image]);
  const pdfUrl = status.kind === 'completed' ? status.url : undefined;
  useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl],
  );
  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      uploadSequence.current++;
      abort.current?.abort();
    };
  }, []);
  function change<K extends keyof Config>(key: K, value: Config[K]) {
    if (busy) return;
    setShowValidation(false);
    setConfig((c) => ({ ...c, [key]: value }));
    setStatus({ kind: image ? 'ready' : 'empty' });
  }
  async function selectFile(file?: File) {
    if (!file || generating) return;
    const sequence = ++uploadSequence.current;
    setLoading(true);
    try {
      const next = await loadImage(file);
      if (sequence !== uploadSequence.current) {
        URL.revokeObjectURL(next.previewUrl);
        return;
      }
      setImage(next);
      setStatus({ kind: 'ready' });
    } catch (e) {
      if (sequence === uploadSequence.current)
        setStatus({
          kind: 'error',
          message: e instanceof Error ? e.message : 'No pudimos abrir esta imagen.',
        });
    } finally {
      if (sequence === uploadSequence.current) setLoading(false);
    }
  }
  async function generate() {
    if (!image || !layout || busy || abort.current) return;
    const controller = new AbortController();
    abort.current = controller;
    const filename = pdfFilename(
      image.file.name,
      layout.posterWidthMm,
      layout.posterHeightMm,
      config.paperId,
    );
    const options: PdfOptions = { ...config, filename: image.file.name, paperName };
    setStatus({
      kind: 'generating',
      progress: { done: 0, total: layout.sheetCount, message: 'Preparando tu PDF…' },
    });
    try {
      const bytes = await createPdf(
        { file: image.file, layout, options },
        (progress) => setStatus({ kind: 'generating', progress }),
        controller.signal,
      );
      const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      setStatus({ kind: 'completed', url: URL.createObjectURL(blob), filename, bytes: blob.size });
    } catch (e) {
      if (controller.signal.aborted) {
        setStatus({ kind: 'ready' });
        setOfflineMessage('Generación cancelada. Tu imagen y tus medidas se conservaron.');
      } else
        setStatus({
          kind: 'error',
          message:
            e instanceof Error ? e.message : 'No pudimos crear el PDF. Puedes volver a intentarlo.',
        });
    } finally {
      abort.current = null;
    }
  }
  let quality = 0;
  if (image && layout) {
    const r = fitImage(
      image.width,
      image.height,
      layout.posterWidthMm,
      layout.posterHeightMm,
      config.fit,
    );
    quality = Math.round(
      planRaster(image.width, image.height, r.width, r.height, config.dpi).effectivePpi,
    );
  }
  return (
    <>
      <a class="skip-link" href="#main">
        Ir al contenido
      </a>
      <Header skin={skin} changeSkin={changeSkin} />
      <SectionNavigation />
      <main id="main">
        <section class="intro">
          <p class="eyebrow">{brand.eyebrow}</p>
          <h1>
            {APP_CONFIG.tagline.split('grandes')[0]}
            <TypewriterWord text="grandes" enabled={titlesAnimated} />
            {APP_CONFIG.tagline.split('grandes')[1]}
          </h1>
          <p class="intro-description">
            Usar el cosito es simple: agrega tu imagen y elige el tamaño.
            <br class="desktop-break" /> De tu pantalla a tu sala, pared o próximo proyecto.
          </p>
          <button
            class="text-button title-motion-control"
            type="button"
            onClick={() => setTitlesAnimated((value) => !value)}
          >
            {titlesAnimated ? 'Pausar animación de titulares' : 'Reanudar animación de titulares'}
          </button>
        </section>
        <div class="workspace">
          <div class="configuration">
            <section class="step" id="imagen" tabIndex={-1} aria-labelledby="image-title">
              <div class="section-heading">
                <span class="step-number">1</span>
                <h2 id="image-title">Agrega tu imagen</h2>
              </div>
              <div
                class={`drop-zone ${dragging ? 'dragging' : ''} ${image ? 'has-image' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!busy) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  if (!busy) void selectFile(e.dataTransfer?.files[0]);
                }}
              >
                {image ? (
                  <div class="image-info">
                    <img src={image.previewUrl} alt="Miniatura de tu imagen" />
                    <div>
                      <strong>{image.file.name}</strong>
                      <span>
                        {image.width} × {image.height} píxeles
                      </span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => fileInput.current?.click()}
                      >
                        Cambiar imagen
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div class="upload-symbol" aria-hidden="true">
                      ↥
                    </div>
                    <button disabled={busy} onClick={() => fileInput.current?.click()}>
                      + Seleccionar imagen
                    </button>
                    <p>o arrástrala hasta aquí</p>
                    <small>JPG, PNG o WEBP · hasta 30 MB</small>
                  </>
                )}
                <input
                  class="sr-only"
                  ref={fileInput}
                  aria-label="Seleccionar archivo de imagen"
                  type="file"
                  disabled={busy}
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    void selectFile(e.currentTarget.files?.[0]);
                    e.currentTarget.value = '';
                  }}
                />
              </div>
              {loading && <p role="status">Abriendo tu imagen…</p>}
            </section>
            <section class="step" id="medidas" tabIndex={-1} aria-labelledby="size-title">
              <div class="section-heading">
                <span class="step-number">2</span>
                <h2 id="size-title">¿Qué tamaño necesitas cubrir?</h2>
              </div>
              <p class="section-note">Las medidas de tu imagen una vez montada.</p>
              <fieldset class="dimension-row" disabled={busy}>
                <legend class="sr-only">Tamaño terminado en centímetros</legend>
                {(['width', 'height'] as const).map((key, i) => (
                  <label for={key} key={key}>
                    {i ? 'Alto' : 'Ancho'}
                    <span class="unit-input">
                      <input
                        id={key}
                        aria-label={i ? 'Alto' : 'Ancho'}
                        type="text"
                        inputMode="decimal"
                        value={config[key]}
                        onInput={(e) => change(key, e.currentTarget.value)}
                        aria-invalid={!layout && validateDimensions}
                        aria-describedby={!layout ? 'config-error' : undefined}
                      />
                      <span>cm</span>
                    </span>
                  </label>
                ))}
                <span class="times" aria-hidden="true">
                  ×
                </span>
              </fieldset>
              <button
                class="text-button"
                disabled={busy}
                onClick={(event) => {
                  event.currentTarget.focus();
                  setPresetsOpen(true);
                }}
              >
                Usar un tamaño frecuente <span aria-hidden="true">↗</span>
              </button>
            </section>
            <section class="step" id="papel" tabIndex={-1} aria-labelledby="paper-title">
              <div class="section-heading">
                <span class="step-number">3</span>
                <h2 id="paper-title">¿Qué papel tienes?</h2>
              </div>
              <label for="paper" class="sr-only">
                Papel
              </label>
              <select
                id="paper"
                disabled={busy}
                value={config.paperId}
                onChange={(e) => change('paperId', e.currentTarget.value)}
              >
                {PAPERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatSize(p.widthMm, p.heightMm)}
                  </option>
                ))}
                <option value="custom">Otro tamaño</option>
              </select>
              {config.paperId === 'custom' && (
                <fieldset class="dimension-row" disabled={busy}>
                  <legend>Tu papel en centímetros</legend>
                  <label>
                    Ancho del papel
                    <span class="unit-input">
                      <input
                        inputMode="decimal"
                        value={config.customWidth}
                        onInput={(e) => change('customWidth', e.currentTarget.value)}
                      />
                      <span>cm</span>
                    </span>
                  </label>
                  <label>
                    Alto del papel
                    <span class="unit-input">
                      <input
                        inputMode="decimal"
                        value={config.customHeight}
                        onInput={(e) => change('customHeight', e.currentTarget.value)}
                      />
                      <span>cm</span>
                    </span>
                  </label>
                </fieldset>
              )}
              <p class="section-note">
                {paper && (
                  <>
                    <strong>{formatSize(paper.widthMm, paper.heightMm)}</strong>
                    <br />
                  </>
                )}
                Elegimos la orientación que necesita menos hojas.
              </p>
            </section>
          </div>
          <section class="result" id="resultado" tabIndex={-1} aria-labelledby="result-title">
            <ResultSummary
              hasImage={!!image}
              layout={layout}
              paperName={paperName}
              showValidation={validateDimensions}
              error={calculation.error}
            />
            {layout && <PosterPreview image={image} layout={layout} fit={config.fit} />}
            <div class="pdf-action">
              {status.kind === 'generating' ? (
                <div class="progress" role="status">
                  <p>{status.progress.message}</p>
                  <progress
                    value={status.progress.done}
                    max={status.progress.total}
                    aria-label="Progreso del PDF"
                  />
                  <button onClick={() => abort.current?.abort()}>Cancelar</button>
                </div>
              ) : status.kind === 'completed' ? (
                <div class="completion" role="status">
                  <h3>Tu PDF está listo</h3>
                  <a class="primary download" href={status.url} download={status.filename}>
                    Descargar PDF <span aria-hidden="true">↓</span>
                  </a>
                  <p>
                    {formatNumber(status.bytes / 1024 / 1024)} MB · Imprime usando{' '}
                    <strong>Tamaño real / 100 %</strong>.
                  </p>
                  <p>Desactiva “Ajustar a página”.</p>
                  <button class="text-button" onClick={generate}>
                    Crear de nuevo
                  </button>
                </div>
              ) : (
                <>
                  <button
                    class="primary create"
                    disabled={!image || !layout || busy}
                    onClick={generate}
                  >
                    Crear PDF <span aria-hidden="true">↓</span>
                  </button>
                  <p class="action-note">
                    {!image
                      ? 'Agrega una imagen para crear tu PDF.'
                      : layout
                        ? 'Listo para imprimir, recortar y unir.'
                        : 'Indica el ancho y el alto finales para crear tu PDF.'}
                  </p>
                </>
              )}
              {status.kind === 'error' && (
                <p role="alert" class="error">
                  {status.message}
                </p>
              )}
            </div>
          </section>
          <AdvancedOptions
            config={config}
            change={change}
            busy={busy}
            quality={quality}
            layout={layout}
          />
        </div>
        <aside class="assembly-help" id="montaje" tabIndex={-1} aria-labelledby="assembly-title">
          <h2 id="assembly-title" aria-label="Del cosito a algo grande.">
            Del cosito a algo <TypewriterWord text="grande" enabled={titlesAnimated} />.
          </h2>
          <ol>
            <li>
              <strong>Imprime al 100 %.</strong> Elige Tamaño real y desactiva Ajustar a página.
            </li>
            <li>
              <strong>Recorta y ordena.</strong> Sigue los números. Desde la segunda columna y fila,
              recorta también la franja repetida izquierda y superior.
            </li>
            <li>
              <strong>Alinea y une.</strong> Junta los bordes recortados y pega por detrás. Conserva
              el contenido de los bordes externos.
            </li>
          </ol>
        </aside>
        {(offlineReady || offlineCached || offlineMessage) && (
          <p class="offline-note" role="status">
            {offlineMessage || 'Disponible sin conexión en este dispositivo.'}
          </p>
        )}
        {needRefresh && (
          <aside class="update">
            <p>
              Hay una nueva versión de {brand.toolName}.
              {image &&
                ' Al actualizar se cerrará tu imagen actual. Descarga primero el PDF que quieras conservar.'}
            </p>
            <button disabled={busy} onClick={() => void updateServiceWorker(true)}>
              {image ? 'Actualizar y cerrar imagen' : 'Actualizar'}
            </button>
          </aside>
        )}
        {installEvent && (
          <button
            class="text-button"
            onClick={async () => {
              await installEvent.prompt();
              await installEvent.userChoice;
              setInstallEvent(null);
            }}
          >
            Instalar {brand.toolName} en este dispositivo
          </button>
        )}
      </main>
      <footer>
        <span>
          {skin === 'los-leones' ? 'Escuela Los Leones · Cosito' : APP_CONFIG.name} · desarrollado
          por <strong>{APP_CONFIG.developer}</strong>
        </span>
        <nav aria-label="Información">
          <a href={APP_CONFIG.repositoryUrl}>Código fuente</a>
          <a href={`${import.meta.env.BASE_URL}PRIVACY.md`}>Privacidad</a>
          <a href={`${import.meta.env.BASE_URL}LICENSE`}>Licencia</a>
        </nav>
      </footer>
      <PresetDialog
        open={presetsOpen}
        close={() => setPresetsOpen(false)}
        widthMm={numeric(config.width) * 10}
        heightMm={numeric(config.height) * 10}
        select={(p) => {
          setConfig((c) => ({
            ...c,
            width: String(p.widthMm / 10),
            height: String(p.heightMm / 10),
          }));
          setStatus({ kind: image ? 'ready' : 'empty' });
        }}
      />
    </>
  );
}
