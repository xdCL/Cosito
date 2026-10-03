// Runs before CSS loads; the system choice follows prefers-color-scheme in CSS.
try {
  const saved = localStorage.getItem('cosito:theme');
  document.documentElement.dataset.theme = saved === 'light' || saved === 'dark' ? saved : 'system';
} catch {
  document.documentElement.dataset.theme = 'system';
}
// Skin is independent of light/dark, and is restored before the first paint.
try {
  document.documentElement.dataset.skin =
    localStorage.getItem('cosito:skin') === 'los-leones' ? 'los-leones' : 'cosito';
} catch {
  document.documentElement.dataset.skin = 'cosito';
}
if (document.documentElement.dataset.skin === 'los-leones') {
  document.title = 'El cosito de Los Leones — Impresión en mosaico';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0066cc');
  const icon = document.querySelector('link[rel="icon"]');
  const iconPath = icon?.getAttribute('href');
  if (iconPath) icon.setAttribute('href', iconPath.replace('icon-192.png', 'school-192.png'));
}
