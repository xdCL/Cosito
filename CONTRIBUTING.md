# Contribuir a Cosito

Usa Node 24, `npm ci`, `npm run dev`. Antes de proponer cambios ejecuta `npm run check`, `npm run format:check` y E2E (`npx playwright install chromium firefox webkit`; `npm run test:e2e`).

Conserva el dominio puro en milímetros, separación UI/PDF/storage, procesamiento local y límites de memoria. Nunca agregues uploads, trackers, fuentes remotas o canvases del póster completo. Documenta cambios de exactitud, montaje y compatibilidad. Una prueba automática no reemplaza una impresión real.

Agrega medidas oficiales verificadas a `src/config/builtin-presets.ts` con ID único y dimensiones exactas. No inventes tamaños de pizarras o instituciones. El build valida el registro. Mantén las claves de almacenamiento versionadas y conserva datos desconocidos.

La identidad está en `src/config/app.ts`; colores y tipografías en `src/styles/tokens.css`. Usa Fraunces en títulos, Inter en controles y texto funcional. Respeta labels, foco, teclado, contraste, papel blanco y reducción de movimiento.

Describe el problema, el comportamiento resultante y la validación. Incluye fixtures o tests de regresión cuando cambies geometría o PDFs.
