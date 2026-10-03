export type Paper = { id: string; name: string; widthMm: number; heightMm: number };
export const PAPERS: readonly Paper[] = [
  { id: 'letter', name: 'Carta / Letter', widthMm: 215.9, heightMm: 279.4 },
  { id: 'a4', name: 'A4', widthMm: 210, heightMm: 297 },
  { id: 'oficio', name: 'Oficio', widthMm: 216, heightMm: 330 },
  { id: 'legal', name: 'Legal', widthMm: 215.9, heightMm: 355.6 },
];
