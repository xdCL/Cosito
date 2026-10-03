import { describe, expect, it } from 'vitest';
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  StandardFonts,
  decodePDFRawStream,
} from 'pdf-lib';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { calculateLayout } from '../src/core/tiling';
import { mmToPt, ptToMm } from '../src/core/units';
import { renderCalibration, renderGuide, renderTile } from '../src/pdf/render-page';
import { fixtureColor, fixturePng } from '../scripts/generate-fixtures';
const base = {
  posterWidthMm: 500,
  posterHeightMm: 980,
  paperWidthMm: 215.9,
  paperHeightMm: 279.4,
  marginMm: 5,
  overlapMm: 5,
  orientation: 'portrait' as const,
};
const options = {
  fit: 'contain' as const,
  dpi: 200 as const,
  cropMarks: true,
  alignmentMarks: true,
  guide: false,
  calibration: false,
  filename: 'imagen ♥.png',
  paperName: 'Carta / Letter',
};
describe('PDF físico e imagen compartida', () => {
  it('lee primera y última página: Carta vertical exacta (1e-6 mm)', async () => {
    const layout = calculateLayout(base);
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const img = await doc.embedPng(fixturePng());
    for (const tile of layout.tiles)
      renderTile(doc, img, font, layout, tile, { x: 0, y: 0, width: 500, height: 980 }, options);
    const loaded = await PDFDocument.load(await doc.save());
    expect(loaded.getPageCount()).toBe(12);
    const refs: string[] = [];
    for (const page of loaded.getPages()) {
      expect(ptToMm(page.getWidth())).toBeCloseTo(215.9, 6);
      expect(ptToMm(page.getHeight())).toBeCloseTo(279.4, 6);
      const xobjects = page.node.Resources()?.lookup(PDFName.of('XObject'), PDFDict);
      expect(xobjects?.values()).toHaveLength(1);
      refs.push(xobjects!.values()[0].toString());
    }
    expect(new Set(refs).size).toBe(1);
  });
  it('rasteriza las 10 hojas y compara coordenadas de la fixture (sin inversión ni recorte erróneo)', async () => {
    const layout = calculateLayout({ ...base, orientation: 'auto' });
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const img = await doc.embedPng(fixturePng());
    for (const tile of layout.tiles)
      renderTile(
        doc,
        img,
        font,
        layout,
        tile,
        { x: 0, y: 0, width: 500, height: 980 },
        { ...options, cropMarks: false, alignmentMarks: false },
      );
    const task = getDocument({ data: await doc.save(), useSystemFonts: true });
    const pdf = await task.promise;
    try {
      expect(pdf.numPages).toBe(10);
      for (const tile of layout.tiles) {
        const page = await pdf.getPage(tile.index + 1);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        const ctx = canvas.getContext('2d');
        await page.render({
          canvas: canvas as unknown as HTMLCanvasElement,
          canvasContext: ctx as unknown as CanvasRenderingContext2D,
          viewport,
        }).promise;
        const r = tile.posterRectMm;
        for (const fraction of [0.33, 0.63]) {
          let x = r.x + r.width * fraction,
            y = r.y + r.height * fraction;
          // Sample away from fixture grid, numbers and quadrant boundaries.
          if (x % 100 < 20) x += 22;
          if (y % 100 < 60) y += 22;
          if (x >= r.x + r.width || y >= r.y + r.height) continue;
          const sample = ctx.getImageData(
            Math.round(mmToPt(5 + x - r.x)),
            Math.round(mmToPt(5 + y - r.y)),
            1,
            1,
          ).data;
          expect([...sample].slice(0, 3)).toEqual(fixtureColor(x, y));
        }
        expect([
          ...ctx.getImageData(Math.round(mmToPt(2)), Math.round(mmToPt(12)), 1, 1).data,
        ]).toEqual([255, 255, 255, 255]);
        page.cleanup();
        canvas.width = 1;
        canvas.height = 1;
      }
    } finally {
      await task.destroy();
    }
  }, 20000);
  it('páginas opcionales conservan papel y calibración tiene vectores exactos', async () => {
    const layout = calculateLayout(base);
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    renderGuide(doc, font, layout, options);
    renderCalibration(doc, font, layout);
    const loaded = await PDFDocument.load(await doc.save());
    expect(loaded.getPageCount()).toBe(2);
    for (const p of loaded.getPages()) {
      expect(p.getWidth()).toBeCloseTo(612, 8);
      expect(p.getHeight()).toBeCloseTo(792, 8);
    }
    const streams = loaded.getPage(1).node.Contents() as PDFArray;
    const text = Array.from({ length: streams.size() }, (_, i) =>
      new TextDecoder().decode(decodePDFRawStream(streams.lookup(i, PDFRawStream)).decode()),
    ).join('\n');
    // Distances 100 mm / 50 mm originate directly from mmToPt, with no raster scaling.
    expect(text).toContain(String(mmToPt(120)));
    expect(text).toContain(String(mmToPt(50)));
  });
});
