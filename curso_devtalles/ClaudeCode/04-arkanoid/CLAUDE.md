# CLAUDE.md

Este archivo proporciona guía a Claude Code (claude.ai/code) al trabajar con código en este repositorio.

## Estado del proyecto

Este es un juego de Arkanoid construido con HTML, CSS y JavaScript puro — sin dependencias, sin herramientas de build, sin `package.json`. Según el `README.md`, el juego jugable en sí **todavía no está implementado**; por ahora solo existen los assets (todavía no hay `index.html` ni JS con la lógica del juego).

Como no hay sistema de build, no hay comandos de build/lint/test que ejecutar. Al ser un juego HTML/CSS/JS sin dependencias, debería ejecutarse abriendo el archivo HTML de entrada directamente en el navegador (o sirviendo el directorio con cualquier servidor estático) una vez que ese archivo de entrada exista.

## Assets y sistema de sprites

- `assets/spritesheet-breakout.png` — la única imagen de spritesheet para todos los gráficos del juego (paleta, bola, bloques, explosiones).
- `assets/spritesheet.js` — define las regiones de sprites y la API de carga/dibujo usada para leer la hoja:
  - `SPRITES` — coordenadas estáticas de sprites (`sx, sy, sw, sh`) para `paddle`, `ball` y `blocks.<color>` (gray, red, yellow, cyan, magenta, hotpink, green).
  - `EXPLOSION_FRAMES` — arreglos de 4 fotogramas de animación por color para la explosión al romper un bloque, junto con `EXPLOSION_DURATION` (150ms).
  - `loadSpritesheet(cb)` — carga el PNG una sola vez en un canvas fuera de pantalla (`ssImg`) y luego invoca los callbacks en cola; debe llamarse antes de dibujar nada.
  - `drawSprite(ctx, name, x, y, w, h)` — dibuja un sprite estático por nombre; los sprites de bloques usan la convención de nombres `block_<color>` (por ejemplo `block_red`), que se resuelve quitando el prefijo `block_` y buscando en `SPRITES.blocks[color]`.
  - `drawFrame(ctx, frame, x, y, w, h)` — dibuja directamente un único fotograma de animación de explosión.
- `assets/sounds/` — efectos de sonido `ball-bounce.mp3` y `break-sound.mp3`.

Al implementar la lógica del juego, reutiliza este esquema existente de nombres de sprites/colores (los siete colores de bloque mencionados arriba) en lugar de introducir otros nuevos, ya que el spritesheet solo tiene regiones para esos colores.
