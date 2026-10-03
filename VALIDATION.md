# Validación de Cosito 0.1.0

Fecha de entrega: **3 de octubre de 2026**, America/Santiago. Entorno: Windows, Node 24.14.1, npm 11.11.0. Este registro separa comprobación automática de prueba física.

## Resultados ejecutados

| Comando                                                   | Resultado real                                                                                                                               |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                                  | Instalación reproducible del lockfile completada; 490 paquetes auditados, 0 vulnerabilidades reportadas por npm.                             |
| `npm run check`                                           | Lint, protección de privacidad, typecheck, 25 tests Vitest y build: correctos.                                                               |
| `npm test`                                                | 25 tests en 5 archivos: correctos.                                                                                                           |
| `npm run format:check`                                    | Todos los archivos comprobados cumplen Prettier.                                                                                             |
| `npm run test:e2e -- --project=chromium --project=webkit` | 37 correctos; 1 omitido de manera explícita (recarga offline en WebKit).                                                                     |
| `npm run test:e2e`                                        | Se intentó la matriz completa. Firefox no inicia en este host; los intentos fallan antes de ejecutar Cosito. No se declara Firefox validado. |

El build genera `/Cosito/`, manifest con scope/start_url correctos, service worker y precache de fuentes, iconos, documentos, chunks diferidos y worker PDF. JS inicial: aproximadamente **18,6 KiB gzip**, más CSS de unos 5,0 KB gzip y fuentes locales de 84,9 KB. pdf-lib se carga al generar; PWA precachea su código para permitir uso offline. No se descargan imágenes del usuario.

Vite avisa que `theme-init.js` es un script clásico sin `type="module"`. Es intencional: se sirve como asset público y se ejecuta antes del primer pintado para aplicar el tema, sin esperar el módulo de la aplicación. El build comprueba que ese asset esté precacheado. npm advierte sobre `glob` transitivo; la auditoría de esta instalación reportó 0 vulnerabilidades.

## Exactitud y contenido

Después del último ajuste visual (dimensiones del papel visibles también fuera del select), `npm run check` y `npm run format:check` pasaron de nuevo, junto con los dos tests responsive de Chromium y WebKit. El smoke de desarrollo en `http://localhost:5173/` comprobó selección, tema claro, generación y descarga. Se guardaron un PDF real en `artifacts/cosito-50x98-carta.pdf` y una captura clara en `artifacts/desktop.png`.

- Carta, 5 mm de margen y 5 mm de solape, 500 × 980 mm: **10 hojas horizontales, 2 columnas × 5 filas**. Vertical requiere 12.
- Mismos parámetros, 290 × 350 mm: **4 hojas, 2 × 2**.
- Casos adicionales: 297 × 210, 500 × 700, 1000 × 700, 2000 × 1000 y 350 × 290 mm; cuatro papeles más uno personalizado, márgenes 0/5 y solapes 0/5.
- Invariantes: cobertura completa, sin huecos, solapes exactos, vecinos coherentes y último tile terminado exactamente en el límite físico.
- Conversiones: tolerancia de 1e-8. Geometría: 1e-7 mm. MediaBox PDF: 1e-6 mm.
- Se generan PDFs, se vuelven a leer y se comparan primera y última página. Carta vertical: 215,9 × 279,4 mm; horizontal: 279,4 × 215,9 mm.
- Se verifica una sola referencia de imagen XObject compartida por todas las hojas.
- PDF.js + canvas nativo renderiza las 10 hojas; muestras calculadas se comparan con una fixture de colores, cuadrícula, coordenadas, números, flechas y bordes. Se verifica también el margen blanco. Esto detecta inversiones, desplazamientos y recortes incorrectos en los puntos muestreados.
- Guía y calibración opcionales mantienen papel; los vectores de 100 mm y 50 mm se comprueban en los streams PDF. El test no sustituye la medición impresa.

## Navegadores, interacción y accesibilidad

La distribución final en una columna pasa **37 E2E Chromium/WebKit**, con la misma omisión offline de WebKit. Los tests recorren las seis secciones en ambas skins a 320, 1366 y 1920 px; comprueban centrado, resultado debajo del papel, foco del destino, URL de sección, botón flotante visible y apertura automática de opciones avanzadas. Se verifican Tab, Escape con retorno de foco, cierre externo y cero violaciones axe-core con menú abierto en ambos estilos y temas. Se inspeccionaron capturas en `artifacts/cosito-columna*.png` y `artifacts/cosito-navegacion*.png`. Lint, tipos, 25 unitarios y build pasan; formato verificado después de actualizar documentos.

Antes del cambio a una columna, la versión con animaciones y skin Escuela Los Leones pasó **33 E2E en Chromium/WebKit**, con la misma omisión offline de WebKit. Se comprueban identidad, icono, título, persistencia, recuperación de un estilo inválido y cambio de skin conservando imagen, medidas y URL del PDF. axe-core no reporta violaciones en Los Leones claro, oscuro, sistema y diálogo; se verifica ausencia de overflow a 320/390/768/1366 px. Se inspeccionaron capturas en `artifacts/cosito-los-leones*.png`. Las pruebas verifican el inicio real de la animación del diálogo y cero animaciones activas con movimiento reducido, conservando selección y foco. El texto no se desvanece y las paletas cambian instantáneamente para conservar contraste durante las transiciones. Lint, tipos, 25 unitarios, build y formato pasan.

Después de aplicar la paleta coral/amarillo/turquesa/lila, `npm run check` y la matriz Chromium/WebKit volvieron a pasar (25 unitarios, 27 E2E, una omisión offline de WebKit). axe-core mantiene cero violaciones en claro, oscuro y diálogo; responsive mantiene los mismos viewports sin overflow. Se inspeccionaron capturas del inicio en claro, oscuro y móvil, guardadas en `artifacts/cosito-paleta-*.png`. Las fuentes Fraunces e Inter se conservan.

Tras quitar las dimensiones iniciales, se repitieron `npm run check` y la matriz Chromium/WebKit: 25 tests unitarios y 27 E2E correctos, con la misma omisión offline de WebKit. El inicio deja ancho y alto vacíos, muestra instrucciones sin error y permite seleccionar A3 antes de ingresar medidas. Los presets personales y la generación también se prueban con 73 × 46 cm; 50 × 98 cm se conserva como ejemplo de regresión.

Chromium y WebKit: PNG, JPG, WEBP, selección y descarga, presets, tema y persistencia, papel personalizado, ajuste exacto/cover, errores recuperables, cancelación y rutas sin createImageBitmap/OffscreenCanvas/Worker.

Sin overflow en viewports **320 × 568, 375 × 667, 390 × 844, 768 × 1024, 1024 × 768, 1366 × 768 y 1920 × 1080**. Se inspeccionaron capturas de móvil y desktop. Se probó un viewport CSS equivalente a 200 % en pantalla de 1366 px; queda pendiente comprobación manual del zoom real en dispositivos objetivo.

axe-core no encontró violaciones WCAG 2 A/AA y 2.1 AA en claro, oscuro y diálogo. Se comprobaron labels, recorrido Tab, cierre Escape y devolución del foco al botón de apertura. Esto no garantiza conformidad completa: lectores de pantalla y uso real siguen requiriendo revisión humana. El papel conserva fondo blanco en oscuro. Los estilos respetan reduced-motion.

## Red y offline

El scanner estático de producción rechaza APIs de envío y servicios externos en `src`. E2E registra las solicitudes de carga/generación y comprueba ausencia de destinos externos, métodos distintos de GET o nombre de archivo del usuario. Sólo se solicitan assets de Cosito del mismo origen.

Chromium: con app y assets cacheados, se activa offline, se **recarga**, se selecciona una imagen, se configura el tamaño, se crea el PDF y se descarga. El test pasa bajo `/Cosito/`, sin haber generado un PDF antes de pasar a offline: demuestra que los chunks diferidos y el worker estaban disponibles en precache.

WebKit: la misma prueba se intentó con `setOffline` y bloqueo HTTP. La automatización falla al navegar, con `WebKit encountered an internal error` o `Blocked by Web Inspector`. Se omite explícitamente ese test; no se reporta éxito offline en WebKit. Regresión documentada en [microsoft/playwright#42775](https://github.com/microsoft/playwright/issues/42775). Safari instalado/iOS requieren verificación manual.

Firefox: Windows informa error de configuración en paralelo, ensamblado `mozglue` no encontrado. Se reinstaló Firefox con `npx playwright install --force firefox`, pero el error persiste. Se conservaron sus pruebas y proyecto Playwright; CI utiliza Linux. No se ejecutó GitHub Actions en un repositorio remoto durante esta entrega.

## Recursos y memoria

Test de ciclos reales de carga → PDF → cambio de medidas → nueva imagen: sólo **1 URL activa** al conservar una preview, **2** al conservar preview + PDF y **0 workers activos** al terminar cada generación. Modificar parámetros invalida el PDF previo y revoca su URL. Se comprueba que el botón vuelve a estar disponible después de error y cancelación.

Auditoría de código: bitmaps cerrados en `finally`, URLs antiguas revocadas, canvas temporal reducido a 1 × 1, preview anterior cancelada, listeners retirados y workers terminados con handlers eliminados. Se transfiere el buffer PDF, no se conserva una colección de buffers de tiles. File, Blob de preparación y documento PDF permanecen sólo mientras son necesarios; pdf-lib requiere memoria del documento y del resultado durante guardado.

Los tests de raster plan prueban los topes de 4096 px/12 MP sin ampliar la fuente y que la estimación mostrada considera esos topes. No se midió RAM en equipos modestos físicos; no se presenta una cifra de pico como comprobada.

## Prueba manual pendiente

Imprimir Carta, A4 y Oficio a Tamaño real / 100 %, medir calibración de 100 mm y cuadrado 50 × 50 mm con regla. Montar 29 × 35 y 50 × 98 cm y medir ancho/alto final, cortes, solapes y alineación. Comprobar márgenes seguros del equipo y legibilidad de referencias. Revisar ChromeOS modesto, teléfono real, Safari/iOS y lectores PDF habituales. La aplicación no controla el escalado del driver.

El sitio **está preparado para despliegue**, pero no se publicó ni se creó un repositorio remoto. Sigue los pasos de GitHub Pages del README. Mantener versión 0.1.0 hasta obtener evidencia física suficiente para v1.0.0.
