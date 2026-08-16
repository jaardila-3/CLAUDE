# SPEC 01 — MVP jugable de Arkanoid

> **Status:** implementado
> **Depends on:** (ninguna)
> **Date:** 2026-08-16
> **Objective:** Construir un Arkanoid jugable de principio a fin con un nivel fijo, paleta, bola, bloques, vidas, puntaje, sonido y high score persistido.

---

## Scope

**In:**

- Loop de juego completo y jugable: paleta, bola, bloques, colisiones, vidas, puntaje.
- Un único nivel fijo: grid de 7 filas x 10 columnas (70 bloques), una fila por cada color existente en el spritesheet (`gray`, `red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`).
- Control de la paleta por teclado (flechas izquierda/derecha o A/D) y por mouse (posición horizontal del cursor), ambos activos simultáneamente.
- Física básica: rebote en paredes y techo, rebote en la paleta con ángulo variable según el punto de impacto, pérdida de vida al tocar el borde inferior.
- Reproducción de `assets/sounds/ball-bounce.mp3` en cada rebote (pared/paleta) y `assets/sounds/break-sound.mp3` al romper un bloque.
- Animación de explosión al romper un bloque, usando `EXPLOSION_FRAMES` / `drawFrame` ya definidos en `assets/spritesheet.js`.
- 3 vidas iniciales.
- Puntaje fijo de 10 puntos por bloque roto, sin distinción por color.
- Pantallas de estado: Start, Game Over, Win.
- Reinicio de partida (vidas, puntaje y bloques restaurados) desde Game Over o Win, con tecla o click, sin recargar la página.
- High score persistido en `localStorage`, se actualiza solo si el puntaje de la partida lo supera, y se muestra en el HUD.
- Canvas fijo de 800x600px.

**Out of scope (for future specs):**

- Múltiples niveles o progresión entre niveles.
- Power-ups.
- Pausa del juego (tecla Esc u otra).
- Canvas responsive o distintos tamaños de pantalla.
- Historial de puntajes (top 10); solo se guarda el máximo histórico.
- Multijugador.
- Dificultad o velocidad configurable por el jugador.

---

## Data model

```js
// js/game.js

// Estado global del juego
const state = {
  screen: "start", // 'start' | 'playing' | 'gameover' | 'win'
  score: 0,
  lives: 3,
  highScore: 0, // cargado desde localStorage al iniciar
};

// Paleta
const paddle = {
  x: 320,
  y: 570,
  w: 162,
  h: 14, // tamaño nativo del sprite `paddle`
  speed: 8, // px/frame al usar teclado
};

// Bola
const ball = {
  x: 400,
  y: 300,
  w: 16,
  h: 16, // tamaño nativo del sprite `ball`
  vx: 4,
  vy: -4, // px/frame
};

// Bloques: grid de 7 filas x 10 columnas
const BLOCK_ROWS = [
  "gray",
  "red",
  "yellow",
  "cyan",
  "magenta",
  "hotpink",
  "green",
];
const BLOCK_COLS = 10;

// Cada bloque activo: { row, col, x, y, w, h, color, exploding: null | { frame, startedAt } }
let blocks = []; // se regenera en resetGame()
```

Convenciones:

- Origen de coordenadas: esquina superior izquierda del canvas.
- Velocidades en píxeles/frame (loop dirigido por `requestAnimationFrame`).
- Clave de `localStorage`: `arkanoid-high-score`, valor numérico como string. Sin versionado de esquema (ver Decisiones).
- El color de cada bloque se resuelve al nombre de sprite `block_<color>` para usar `drawSprite`.

---

## Implementation plan

1. Crear `index.html` con el `<canvas id="game" width="800" height="600">`, el HUD (score, vidas, high score) y los `<script>` que cargan `assets/spritesheet.js` y luego `js/game.js`, además del `<link>` a `css/style.css`. El archivo debe abrir en el navegador sin errores y mostrar un canvas vacío.
2. Crear `css/style.css` con estilos mínimos: centrar el canvas, fondo oscuro, tipografía del HUD.
3. En `js/game.js`, llamar a `loadSpritesheet(cb)` y, una vez cargado, arrancar el loop con `requestAnimationFrame` dibujando la pantalla `start` ("Presiona Espacio o haz click para jugar"). Verificación manual: se ve el mensaje de inicio.
4. Implementar la paleta: dibujo con `drawSprite(ctx, 'paddle', ...)`, movimiento por teclado (flechas/A-D) y por mouse (`mousemove` sobre el canvas), con clamp a los bordes del canvas. Verificación manual: la paleta se mueve con ambos métodos sin salirse del canvas.
5. Implementar la bola: dibujo con `drawSprite(ctx, 'ball', ...)`, movimiento, rebote en paredes/techo, rebote en la paleta con ángulo dependiente del punto de impacto, y pérdida de vida al cruzar el borde inferior (con reproducción de `ball-bounce.mp3` en cada rebote). Verificación manual: la bola rebota correctamente y pierde una vida al caer.
6. Implementar los bloques: generar el grid de 70 bloques (`BLOCK_ROWS` x `BLOCK_COLS`) en `resetGame()`, dibujarlos con `drawSprite(ctx, 'block_<color>', ...)`, detectar colisión bola-bloque, eliminar el bloque, sumar 10 puntos, reproducir `break-sound.mp3` y disparar la animación de explosión (`EXPLOSION_FRAMES`/`drawFrame` durante `EXPLOSION_DURATION`). Verificación manual: al golpear un bloque desaparece con animación y sonido, y el score sube.
7. Implementar las transiciones de estado: 0 bloques restantes → `screen = 'win'`; 0 vidas → `screen = 'gameover'`. Ambas pantallas muestran el resultado y el mensaje de reinicio. Verificación manual: perder las 3 vidas muestra Game Over; romper todos los bloques muestra Win.
8. Implementar el reinicio: en `screen` `gameover` o `win`, tecla Espacio o click llama a `resetGame()` (vidas=3, score=0, bloques regenerados, bola/paleta en posición inicial) y vuelve a `screen = 'playing'`. Verificación manual: reiniciar funciona sin recargar la página.
9. Implementar el high score: al cargar el juego, leer `localStorage['arkanoid-high-score']` (o 0 si no existe) y mostrarlo en el HUD; al entrar a `gameover` o `win`, comparar `state.score` contra el guardado y actualizar `localStorage` si es mayor. Verificación manual: superar el high score, recargar la página, confirmar que persiste.

---

## Acceptance criteria

- [x ] Abrir `index.html` en el navegador no muestra errores en la consola.
- [x ] Se ve una pantalla de inicio con instrucción para comenzar (tecla o click).
- [x ] La paleta se mueve con flechas/A-D y con el mouse, sin salir del canvas.
- [x ] La bola rebota en paredes y techo, y cambia de ángulo al rebotar en la paleta según el punto de impacto.
- [x ] Al golpear un bloque, este desaparece, se reproduce la animación de explosión y el sonido `break-sound.mp3`.
- [x ] El puntaje aumenta exactamente 10 puntos por cada bloque roto.
- [x ] Cada vez que la bola cae por el borde inferior se resta una vida y se reproduce `ball-bounce.mp3` en los rebotes normales.
- [x ] Al llegar a 0 vidas se muestra la pantalla de Game Over.
- [x ] Al romper los 70 bloques se muestra la pantalla de Win.
- [x ] Desde Game Over o Win, tecla/click reinicia la partida (vidas, puntaje y bloques restaurados) sin recargar la página.
- [x ] El high score se guarda en `localStorage` bajo la clave `arkanoid-high-score` y persiste tras recargar la página.
- [x ] El high score mostrado en el HUD solo se actualiza cuando el puntaje de la partida lo supera.

---

## Decisions

- **Yes:** controles de teclado y mouse activos simultáneamente. El usuario lo pidió explícitamente en vez de forzar uno solo.
- **Yes:** un único nivel fijo de 70 bloques (7 colores x 10 columnas). Es el alcance mínimo real para un MVP jugable de principio a fin.
- **No:** múltiples niveles. Se decidió explícitamente dejarlo fuera para no inflar el MVP; queda para una spec futura.
- **Yes:** puntaje fijo (10 pts) por bloque sin distinción de color. Simplifica el MVP; una tabla de puntajes por color puede añadirse después sin romper el modelo actual.
- **Yes:** sonido incluido desde el MVP (`ball-bounce.mp3`, `break-sound.mp3`). Los assets ya existen en el repo para esto.
- **Yes:** animación de explosión al romper bloques usando `EXPLOSION_FRAMES`/`drawFrame`. Es el esquema que ya define `assets/spritesheet.js` y que `CLAUDE.md` pide reutilizar.
- **Yes:** high score en `localStorage` sin versionado de esquema (clave simple `arkanoid-high-score`). Es un único valor numérico primitivo; una clave versionada sería sobre-ingeniería para este caso.
- **No:** pausa del juego. No fue solicitada y no es necesaria para un MVP jugable.
- **Yes:** reinicio en la misma pantalla sin recargar la página. El usuario lo pidió explícitamente para no perder el high score cargado ni forzar un F5.
- **Yes:** canvas fijo de 800x600px, sin soporte responsive. Simplicidad para el MVP; el resize queda fuera de alcance.

---

## Risks

| Risk                                                                                                 | Mitigation                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `localStorage` deshabilitado (navegación privada en algunos navegadores)                             | El juego sigue funcionando; si `localStorage` lanza error al leer/escribir, se captura y el high score simplemente no persiste esa sesión.   |
| Túnel de colisión: a alta velocidad la bola puede "atravesar" un bloque o la paleta en un solo frame | Mantener `vx`/`vy` moderados (4px/frame) y usar el rectángulo completo de movimiento del frame para la detección, no solo la posición final. |

---

## What is **not** in this spec

- Múltiples niveles o progresión entre niveles.
- Power-ups.
- Pausa del juego.
- Canvas responsive.
- Historial de puntajes (top 10).
- Multijugador.
- Dificultad configurable.

Cada uno de estos, si se implementa, va en su propia spec.
