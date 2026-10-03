export function pdfFilename(
  name: string,
  widthMm: number,
  heightMm: number,
  paper: string,
): string {
  const clean = (s: string) =>
    s
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
  return `${clean(name.replace(/\.[^.]+$/, '')) || 'imagen'}-${widthMm / 10}x${heightMm / 10}cm-${clean(paper)}-${APP_CONFIG.name.toLowerCase()}.pdf`;
}
import { APP_CONFIG } from '../config/app';
