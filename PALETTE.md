# Colores y voz de Cosito

Una paleta de materiales de taller: papel crema, coral, amarillo, turquesa y lila. Los colores vivos aparecen en acciones y detalles; los textos usan tinta oscura para conservar la lectura.

| Color           | Hex       | Uso                                            |
| --------------- | --------- | ---------------------------------------------- |
| Papel crema     | `#FFF9F0` | Fondo del tema claro                           |
| Coral           | `#FF7C66` | Botones principales, primer paso e icono       |
| Amarillo        | `#FFD166` | Segundo paso y guía de montaje                 |
| Turquesa        | `#42C7B6` | Tercer paso y detalles de marca                |
| Lila            | `#B9A2EE` | Borde de la vista previa                       |
| Tinta ciruela   | `#2E2842` | Títulos, texto y etiquetas sobre colores vivos |
| Turquesa oscuro | `#006B62` | Enlaces y estados positivos en claro           |

Los fondos suaves turquesa (`#DDF7F1`) y lila (`#F0E9FF`) agrupan la carga de imagen y el resultado. Los campos mantienen superficies claras y bordes visibles. La hoja de la vista previa conserva blanco en ambos temas.

En oscuro, el fondo es `#221F30`, las superficies `#2C283D` y el resultado `#383045`. El texto pasa a crema `#FFF8F0`, los enlaces a turquesa `#79DFCC` y los botones a coral `#FF9B86`, con tinta ciruela.

Se conservan **Fraunces** en títulos y marca e **Inter** en textos y controles, con archivos locales. Los tokens están en `src/styles/tokens.css`.

La marca se escribe **Cosito**. En frases cotidianas también puede decirse **el cosito** o **usar el cosito**. La voz es cercana, breve y concreta: “Usar el cosito es simple: agrega tu imagen y elige el tamaño”. Los controles conservan nombres claros como “Crear PDF” y “Descargar PDF”.

## Escuela Los Leones

Se selecciona en **Estilo → Escuela Los Leones**. La jerarquía visual se orienta a aproximadamente **70 % azul, 20 % amarillo y 10 % blanco**, como distribución de protagonismo y superficies; cambia según el contenido y el tamaño de pantalla.

| Color            | Hex                   | Uso                                                |
| ---------------- | --------------------- | -------------------------------------------------- |
| Azul escolar     | `#0066CC`             | Fondo dominante e identidad                        |
| Amarillo escolar | `#FFCC00`             | Marca, pasos, panel de resultado y guía de montaje |
| Blanco           | `#FFFFFF`             | Texto sobre azul, campos y papel                   |
| Azul profundo    | `#0052A3` / `#00366C` | Superficies y tinta sobre amarillo/blanco          |

El modo oscuro usa una base azul noche `#002B57`, conserva el amarillo y mantiene los campos y el papel blancos. Para el texto pequeño amarillo se usa un fondo azul profundo: el azul escolar se reserva para superficies y texto blanco con contraste suficiente. La identidad se expresa con el nombre de la escuela, sin inventar un escudo.

La elección se guarda en `cosito:skin`, separada de `cosito:theme`. Cambiar de skin conserva el trabajo actual. La PWA sigue siendo la misma instalación de Cosito y el PDF conserva su contenido físico; esta skin personaliza la interfaz. Configuración de identidad: `src/theme/skin.ts`; colores: `src/styles/skins.css`.

## Movimiento

La interfaz usa una columna de hasta 720 px, centrada en escritorio y adaptable al móvil. La hamburguesa **Secciones** permanece flotante arriba, enlaza las seis secciones y abre las opciones avanzadas al navegar hacia ellas. Los saltos dejan 96 px de espacio superior y llevan el foco al destino. El desplazamiento es suave cuando el sistema permite movimiento; con movimiento reducido es inmediato.

120 ms para pulsación y respuesta de controles, 180 ms para imagen, resultado PDF y diálogo, 220 ms para la entrada de las secciones. El desplazamiento máximo es 6 px y la pulsación reduce el botón a 98 %. Sin rebotes ni animaciones permanentes. Se animan transformaciones y bordes; los cambios de paleta son instantáneos para evitar contrastes intermedios. Con `prefers-reduced-motion: reduce`, no se aplican estas animaciones ni transiciones. Implementación: `src/styles/motion.css`.
