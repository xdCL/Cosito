# Cosito

**Imprime imágenes grandes usando las hojas que ya tienes.**

Cosito convierte una imagen en un mosaico de hojas listo para imprimir y montar.

**[Usar el cosito](https://xdcl.github.io/Cosito/)**

🔒 Todo el procesamiento ocurre localmente en tu navegador.

Desarrollado por **xdCL**. Versión **0.1.0**, licencia MIT.

## Uso

1. Selecciona o arrastra un JPG, PNG o WEBP.
2. Indica el ancho y el alto finales en centímetros, o elige un tamaño frecuente.
3. Elige Carta / Letter, A4, Oficio (21,6 × 33 cm), Legal o papel personalizado.
4. Revisa el mosaico y pulsa **Crear PDF**, luego **Descargar PDF**.
5. Imprime usando **Tamaño real / 100 %**. Desactiva **Ajustar a página**.
6. Recorta los márgenes. En hojas con vecinos a la izquierda o arriba, recorta también la banda repetida izquierda o superior. Conserva esas bandas en los bordes externos. Junta los bordes recortados y pega por detrás siguiendo A1, A2…; B1, B2…

Predeterminado: margen seguro 5 mm, solape 5 mm, imagen completa y orientación automática. El solape repite contenido; **no aumenta el tamaño final**. Puedes cubrir todo recortando bordes o ajustar exacto deformando la imagen. Opciones avanzadas incluyen calidad, orientación, marcas y páginas opcionales de guía y calibración; no se añaden hojas extra por defecto.

## Funciones

Cada proyecto empieza con ancho y alto vacíos. No hay una medida de póster fija; 50 × 98 cm es sólo uno de los ejemplos usados para comprobar el cálculo.

- Orientación que minimiza hojas, con desempate determinista por cobertura sobrante y uniones.
- Vista previa reducida, numeración y guía de montaje siempre disponibles en pantalla.
- Temas Sistema, Claro y Oscuro, sin cambiar el color del papel.
- Paleta coral, amarillo, turquesa y lila sobre crema; [colores y voz](PALETTE.md).
- Skin Escuela Los Leones desde **Estilo**, independiente de Tema: azul `#0066CC`, amarillo `#FFCC00` y blanco. Se recuerda en este navegador.
- Animaciones breves de 120–220 ms en controles, entradas y diálogos; se desactivan con la preferencia de movimiento reducido del sistema.
- Gradientes suaves como manchas de acuarela en ambas skins y subrayados irregulares. Los titulares escriben y borran una palabra lentamente, sin mover el contenido; pueden pausarse y respetan movimiento reducido.
- Fraunces e Inter variables WOFF2 empaquetadas, sin CDN ni Google Fonts.
- Tamaños oficiales A3–A0 y presets personales con creación, renombrado y eliminación local.
- PDF físico en milímetros, progreso, cancelación y descarga local.
- PWA instalable y uso offline después de que termine la primera descarga de assets.
- Interfaz móvil, controles táctiles, teclado, diálogo nativo con foco y Escape.
- Una columna centrada en todas las pantallas. Menú flotante **Secciones** para saltar a imagen, medidas, papel, vista previa/PDF, opciones y montaje; abre las opciones al seleccionarlas y se cierra con Escape o al salir.

## Privacidad y compatibilidad

Sin servidor, cuentas, tokens, analytics, anuncios ni uploads. Sólo se guardan el tema, el estilo y los tamaños personales. [Política de privacidad](PRIVACY.md).

Destinado a versiones modernas de Chrome, Edge, Firefox y Safari, incluyendo Windows, macOS, ChromeOS y móviles. No requiere Adobe Reader. HTMLImageElement y Canvas proporcionan rutas alternativas cuando createImageBitmap u OffscreenCanvas no están disponibles. La instalación PWA depende del navegador; en Safari usa Compartir → Añadir a pantalla de inicio. HTTPS o localhost son necesarios para el service worker.

## Desarrollo

Node **24** y npm. Node se utiliza sólo para desarrollar, construir y probar; producción es estática.

```sh
npm ci
npm run dev
```

Abre http://localhost:5173/. Comandos:

```sh
npm run lint
npm run typecheck
npm test
npm run check
npx playwright install chromium firefox webkit
npm run test:e2e
npm run format:check
```

`npm run check` ejecuta lint, protección de privacidad, tipos, tests y build. `npm run build` valida presets, empaqueta las fuentes, crea el precache y verifica base path, PWA y presupuesto inicial de JS (200 KB gzip). `npm run preview` sirve la producción en http://localhost:4173/Cosito/.

## GitHub Pages

Sitio publicado: **[Usar el cosito](https://xdcl.github.io/Cosito/)**. Código fuente: [xdCL/Cosito](https://github.com/xdCL/Cosito). GitHub Pages está activado con GitHub Actions y HTTPS; cada push a **main** valida y despliega la versión nueva.

Para publicar una copia en otra cuenta:

1. Crea un repositorio público **Cosito**, agrega estos archivos y el lockfile a la rama **main**, y adapta `src/config/app.ts` a tu repositorio.
2. En **Settings → Pages → Build and deployment → Source**, selecciona **GitHub Actions**.
3. Haz push a **main**, o ejecuta manualmente **Deploy GitHub Pages** en Actions.
4. Espera que terminen validaciones y despliegue. El entorno `github-pages` mostrará la URL.

CI verifica cada push y pull request. El deploy ejecuta `npm run check` y E2E Chromium antes de `configure-pages`, `upload-pages-artifact` y `deploy-pages`. Una validación fallida impide publicar. El build usa `/Cosito/`; desarrollo usa `/`. Para otro subdirectorio, define `COSITO_BASE=/otro/` en el paso build y adapta la URL E2E. Para un dominio raíz utiliza `COSITO_BASE=/`.

Flujo oficial: [GitHub Pages con workflows propios](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Arquitectura y exactitud

- `src/core`: conversiones puras, geometría y ajuste contain/cover/stretch, sin DOM, Preact ni PDF.
- `src/config`: identidad, papeles, límites y tamaños oficiales. Agregar presets requiere sólo datos válidos; no se inventan medidas institucionales.
- `src/presets`: validación, almacenamiento versionado y migración; datos corruptos/futuros se conservan y no se sobrescriben.
- `src/image`: inspección de cabecera antes de decodificar, orientación EXIF del navegador, miniatura y liberación de recursos.
- `src/pdf`: carga diferida de pdf-lib, worker, recorte vectorial, marcas y páginas auxiliares.
- `src/app`, `src/components`, `src/theme`, `src/styles`: estado serializable de configuración, estados explícitos de generación, controles y tokens semánticos.

Para dimensión útil `u = papel − 2 × margen`, avance `s = u − solape`. Para un póster `d ≤ u`, basta una hoja; en otro caso `n = 1 + ceil((d − u) / s)`. Cobertura `u + (n − 1) × s`. Tolerancia geométrica: **1e-7 mm**. El último tile se corta exactamente al límite del póster. Se comparan ambas orientaciones por hojas, cobertura sobrante, uniones y finalmente vertical para un empate exacto.

`1 mm = 72 / 25,4 pt`. La resolución no determina el MediaBox. La misma imagen se incrusta **una sola vez** como XObject y se reutiliza mediante transformación y clipping en cada hoja. La conversión de coordenadas superiores a coordenadas PDF inferiores es explícita. [API pdf-lib](https://pdf-lib.js.org/docs/api/classes/pdfpage).

## Memoria y límites

El póster existe como geometría: no hay canvas del póster a resolución de impresión ni canvases por todas las hojas. La miniatura tiene como máximo 1200 px por lado y se descarta el bitmap original después de crearla. Al generar, se decodifica de nuevo y se normaliza una única imagen acotada a **4096 px por lado y 12 MP**. El tamaño solicitado a 150/200/300 ppp es un objetivo limitado por la fuente y estos topes; un póster grande puede tener menor resolución efectiva. PNG/WEBP se normalizan a PNG para conservar transparencia y líneas, JPEG a JPEG. No se usa base64.

Límites ajustables en `src/config/limits.ts`: **30 MB por archivo, 24 MP de fuente, 16.384 px por lado, 100 hojas**. Se inspeccionan dimensiones antes de decodificar. La cabecera JPEG debe aparecer en los primeros 512 KiB; archivos con metadatos excepcionalmente grandes pueden rechazarse. Se avisa desde 40 hojas y en combinaciones de alta calidad y muchas hojas.

Con Worker + OffscreenCanvas + createImageBitmap, el procesamiento ocurre fuera de la UI; File se comparte como Blob y el resultado se transfiere sin copia. Terminar el worker cancela y libera su memoria. La alternativa Canvas/HTMLImageElement cede el control entre páginas y durante guardado, aunque decodificación y compresión pueden pausar brevemente la UI. pdf-lib mantiene el documento y su resultado en memoria; no es un escritor streaming.

Las Object URLs se revocan al sustituir imagen/PDF o desmontar; ImageBitmap se cierra en `finally`, canvases temporales se reducen a 1 × 1, se eliminan listeners y se terminan workers. No se guardan archivos en LocalStorage ni en el service worker.

## Validación

**Validado automáticamente** y **validado en impresora** son categorías distintas. Consulta [VALIDATION.md](VALIDATION.md) para comandos y resultados del entorno de desarrollo.

Tests: unidades (tolerancia 1e-8), casos geométricos e invariantes, presets/storage/tema, dimensiones físicas PDF (tolerancia 1e-6 mm), reutilización de imagen y contenido rasterizado. E2E: selección, 50 × 98 cm, generación/descarga, móvil, temas, teclado, accesibilidad, alternativas de navegador y red/offline. Fixtures programáticas de cuadrícula, coordenadas, números, flechas y bordes.

Regresiones obligatorias: Carta con margen y solape de 5 mm:

| Póster     | Resultado                                                 |
| ---------- | --------------------------------------------------------- |
| 50 × 98 cm | 10 hojas, horizontal, 2 columnas × 5 filas (vertical: 12) |
| 29 × 35 cm | 4 hojas, 2 columnas × 2 filas                             |

**Pendiente en impresora:** Carta, A4 y Oficio; calibración con regla, 29 × 35 y 50 × 98 cm, cortes, alineación, solapes y márgenes del equipo. Los drivers pueden escalar aunque el PDF sea matemáticamente exacto. No declarar v1.0.0 sin pruebas físicas suficientes.

## Limitaciones y próxima versión

HEIC, PDF de entrada, impresoras específicas, impresión directa, URL compartible e importación/exportación de presets quedan fuera de v0.1.0. Sin margen suficiente se omiten marcas y etiquetas para proteger el contenido; con margen cero se necesita una impresora sin bordes. Las guías requieren papel de al menos 14 × 18 cm y calibración 13 × 18 cm en la orientación elegida. Todas las páginas conservan el mismo tamaño de papel. En cuadrículas extremas, las etiquetas de la vista previa/guía son pequeñas; la lista de orden en pantalla permanece disponible.

Próxima release: pruebas físicas documentadas, más medidas oficiales verificadas y ajuste de límites con equipos modestos reales. No se promete compatibilidad con todos los lectores o impresoras sin pruebas reales.

## Contribuir y licencia

Lee [CONTRIBUTING.md](CONTRIBUTING.md). Código bajo [MIT](LICENSE). Fraunces e Inter bajo SIL Open Font License; [licencias completas](FONT-LICENSES.md).
