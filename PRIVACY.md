# Privacidad de Cosito

Cosito procesa archivos íntegramente en el navegador. No hay backend, cuentas, claves, uploads, analytics, telemetría, publicidad ni servicios de procesamiento externos.

La imagen seleccionada permanece como File local. Se decodifica en memoria para la miniatura y el PDF. El PDF se entrega como Blob local a través de una Object URL. No se envían imágenes, píxeles, nombres de archivo ni PDFs por red. No se guardan imágenes ni PDFs al cerrar o recargar.

LocalStorage conserva únicamente `cosito:theme`, `cosito:skin` (Cosito o Escuela Los Leones) y `cosito:user-size-presets` (JSON versionado). Puedes borrar los tamaños desde su diálogo y los datos locales desde los ajustes del navegador. Los datos corruptos o de versiones futuras no se sobrescriben.

El service worker precachea exclusivamente HTML, JS (incluido el motor PDF), CSS, fuentes, iconos y documentos públicos de Cosito. No tiene caché de archivos del usuario, rutas de upload ni runtime caching de imágenes o Blobs. Las actualizaciones piden una acción en pantalla y advierten que una imagen cargada se cerrará.

Se descargan assets públicos del mismo origen al abrir o actualizar la aplicación. El proveedor de hosting puede registrar accesos normales al sitio; Cosito no agrega ningún tracking. Pulsar Código fuente abre GitHub; eso es una navegación voluntaria fuera de la aplicación.

## Protección y auditoría

`npm run lint` ejecuta `scripts/privacy-check.ts`, que rechaza fetch, XMLHttpRequest, WebSocket, EventSource, sendBeacon y URLs de servicios externos dentro de `src`. La excepción explícita es el enlace al repositorio; el registro PWA se genera por vite-plugin-pwa y sirve únicamente assets del mismo origen.

La CSP permite scripts/fuentes/workers del mismo origen; imágenes locales blob:; ninguna conexión externa ni formularios. `style-src 'unsafe-inline'` se limita a los estilos dinámicos de la geometría de la preview y Preact. No se permite unsafe-eval, scripts inline, object ni workers blob:. La meta CSP funciona en hosting estático de Pages, que no permite configurar cabeceras arbitrarias.

E2E carga producción en `/Cosito/`, espera el service worker, recarga bajo su control y pasa a offline. Luego selecciona imagen, configura y genera/descarga PDF sin conexión. Otro test registra solicitudes después de la carga, rechaza destinos externos y métodos distintos de GET, y comprueba que el nombre del archivo no aparece en solicitudes. Los resultados reales se registran en VALIDATION.md.
