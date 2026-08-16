# CLAUDE.md

Este archivo proporciona guía a Claude Code (claude.ai/code) al trabajar con código en este repositorio.

## Estado del proyecto

Este es un juego de Arkanoid construido con HTML, CSS y JavaScript puro — sin dependencias, sin herramientas de build, sin `package.json`. El MVP jugable está **implementado** (ver `specs/01-mvp-jugable.md`): `index.html` carga `assets/spritesheet.js` y luego `js/game.js`, con estilos en `css/style.css`.

Como no hay sistema de build, no hay comandos de build/lint/test que ejecutar. El juego se ejecuta abriendo `index.html` directamente en el navegador (o sirviendo el directorio con cualquier servidor estático).

## Especificaciones

El directorio `specs/` contiene las specs de features en formato spec-driven (ver `specs/.spec-config.yml`). `specs/01-mvp-jugable.md` documenta el MVP actual: loop de juego completo, un nivel fijo de 70 bloques (7 colores x 10 columnas), física de la bola con ángulo variable en la paleta, sonido, animación de explosión, 3 vidas, puntaje, pantallas de Start/Game Over/Win con reinicio sin recargar, y high score persistido en `localStorage` (clave `arkanoid-high-score`). Fuera de alcance por ahora: múltiples niveles, power-ups, pausa, canvas responsive, historial de puntajes y multijugador — cada uno debe ir en su propia spec futura.

Al modificar la lógica del juego en `js/game.js`, respeta las convenciones ya establecidas en `specs/01-mvp-jugable.md` (velocidades en px/frame, origen de coordenadas en la esquina superior izquierda, detección de colisión con el rectángulo de movimiento del frame para evitar túnel) salvo que una nueva spec las cambie explícitamente.

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
