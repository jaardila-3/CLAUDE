# Juego de Arkanoid

Un juego de Arkanoid construido con HTML, CSS y JavaScript puro, sin dependencias.

## Cómo jugar

Abre `index.html` directamente en el navegador (o sirve el directorio con cualquier servidor estático).

- Mueve la paleta con las flechas izquierda/derecha, las teclas A/D, o el mouse.
- Presiona Espacio o haz click para empezar y para reiniciar tras un Game Over o un Win.
- Rompe los 70 bloques (7 filas de colores x 10 columnas) sin quedarte sin las 3 vidas.
- El high score se guarda en `localStorage` y persiste entre partidas.

## Estado

El MVP jugable (nivel único, física de la bola, puntaje, vidas, sonido, animación de explosión y high score) está implementado — ver `specs/01-mvp-jugable.md`. Fuera de alcance por ahora: múltiples niveles, power-ups, pausa, canvas responsive y multijugador.
