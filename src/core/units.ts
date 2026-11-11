export const cmToMm = (cm: number) => cm * 10;
export const mmToCm = (mm: number) => mm / 10;
export const mmToPt = (mm: number) => (mm * 72) / 25.4;
export const ptToMm = (pt: number) => (pt * 25.4) / 72;
export const inToMm = (inches: number) => inches * 25.4;
export const mmToIn = (mm: number) => mm / 25.4;
export const mmToPx = (mm: number, dpi: number) => (mm * dpi) / 25.4;
export const formatNumber = (value: number, maximumFractionDigits = 2) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits }).format(value);
export const formatSize = (widthMm: number, heightMm: number, digits = 2) =>
  `${formatNumber(mmToCm(widthMm), digits)} × ${formatNumber(mmToCm(heightMm), digits)} cm`;
