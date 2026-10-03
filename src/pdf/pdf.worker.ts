import { generatePdf } from './generate-pdf';
import type { PdfRequest } from './types';
self.onmessage = async (event: MessageEvent<PdfRequest>) => {
  try {
    const bytes = await generatePdf(event.data, (progress) =>
      self.postMessage({ type: 'progress', progress }),
    );
    self.postMessage({ type: 'complete', bytes }, { transfer: [bytes.buffer as ArrayBuffer] });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'No pudimos crear el PDF.',
    });
  }
};
