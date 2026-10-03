import type { PdfRequest, Progress } from './types';
/** Worker termination cancels decoding, embedding and saving immediately. */
export async function createPdf(
  request: PdfRequest,
  progress: (p: Progress) => void,
  signal: AbortSignal,
): Promise<Uint8Array> {
  if (
    typeof Worker === 'function' &&
    typeof OffscreenCanvas === 'function' &&
    typeof createImageBitmap === 'function'
  ) {
    let worker: Worker;
    try {
      worker = new Worker(new URL('./pdf.worker.ts', import.meta.url), { type: 'module' });
    } catch {
      return (await import('./generate-pdf')).generatePdf(request, progress, signal);
    }
    return new Promise((resolve, reject) => {
      const dispose = () => {
        worker.terminate();
        worker.onmessage = null;
        worker.onerror = null;
        signal.removeEventListener('abort', cancel);
      };
      const fallback = () => {
        dispose();
        void import('./generate-pdf')
          .then((module) => module.generatePdf(request, progress, signal))
          .then(resolve, reject);
      };
      const cancel = () => {
        dispose();
        reject(new DOMException('Generación cancelada.', 'AbortError'));
      };
      signal.addEventListener('abort', cancel, { once: true });
      if (signal.aborted) {
        cancel();
        return;
      }
      worker.onmessage = (event) => {
        const data = event.data;
        if (data.type === 'progress') progress(data.progress);
        else if (data.type === 'complete') {
          dispose();
          resolve(data.bytes);
        } else if (data.message?.includes('en este navegador')) {
          fallback();
        } else {
          dispose();
          reject(new Error(data.message));
        }
      };
      worker.onerror = fallback;
      worker.postMessage(request);
    });
  }
  return (await import('./generate-pdf')).generatePdf(request, progress, signal);
}
