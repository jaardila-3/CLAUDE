# 02 — Home (landing) en la raíz y Biblioteca movida a /games

**Estado:** aprobado
**Depende de:** SPEC 01
**Fecha:** 2026-08-17

**Objetivo:** Implementar la pantalla Home (landing) de `references/templates/home-about/home.jsx` como la ruta `/`, mover la Biblioteca actual de `/` a `/games` (junto con su ruta de detalle `/games/[id]`), y agregar el link "Inicio" al Nav antes de "Biblioteca".

## Alcance

**Incluido:**

- Nueva pantalla Home en `/`: hero con siluetas SVG flotantes, sección "¿Por qué Arcade Vault?" (feature grid), sección "Juegos disponibles ahora" (mini-rail con `GAMES.slice(0, 6)`), sección de stats, sección "Actividad en vivo" (ticker de puntuaciones + top jugadores, datos mock hardcodeados como en el template), sección de precios ("Plan único" + FAQ) y CTA final — todo tal como aparece en `home.jsx`, incluyendo las animaciones de scroll-reveal (`IntersectionObserver` + clases `.reveal`/`.in`).
- Biblioteca movida de `/` a `/games` (mismo contenido y comportamiento que hoy, solo cambia la ruta).
- Detalle movido de `/biblioteca/[id]` a `/games/[id]` (mismo contenido y comportamiento, solo cambia la ruta).
- Nav actualizado: nuevo link "Inicio" apuntando a `/`, insertado antes de "Biblioteca" (que ahora apunta a `/games`), tanto en el nav de escritorio como en el panel móvil. El logo sigue apuntando a `/`.
- Todos los enlaces internos que apuntaban a `/biblioteca/[id]` o usaban `/` como "volver a la biblioteca" actualizados a `/games` / `/games/[id]` (`GameCard`, botón "Volver al Vault" en Detalle y en el modal del Reproductor, botón "Salir" del Reproductor, submit de Auth y "Jugar como invitado").
- Clases CSS del Home añadidas a `app/globals.css`, portadas desde `references/templates/home-about/styles.css` (bloques `HOME PAGE`, `ACTIVITY` y `PRICING`), sin modificar ni eliminar reglas existentes.

**No incluido:**

- La pantalla "Acerca de" (`about.jsx`) y su link de Nav — decisión explícita del usuario, queda fuera de esta spec.
- Cualquier dato real o dinámico en las secciones "Actividad en vivo" o "Juegos disponibles ahora" más allá de lo ya mockeado — siguen siendo datos estáticos de ejemplo.
- Cambios a `/salon` más allá de que su link en el Nav quede después de "Inicio" y "Biblioteca".
- Cambios a la lógica interna de `/auth` o `/jugar/[id]` más allá de actualizar los enlaces de navegación mencionados arriba.
- Persistencia, autenticación real o backend — se mantiene el alcance 100% visual del MVP definido en la spec 01.

## Modelo de datos

No se introduce ningún tipo ni estructura nueva. El Home reutiliza `GAMES` de `lib/data.ts` (para el mini-rail, vía `GAMES.slice(0, 6)`) y usa arrays de datos mock hardcodeados dentro del propio componente para el ticker de "Actividad en vivo" y el bloque "Top jugadores", igual que en `home.jsx`. No se migran a `lib/data.ts` porque no se reutilizan en ninguna otra pantalla.

## Plan de implementación

1. Crear `app/games/page.tsx` con el contenido actual de `app/page.tsx` (pantalla Biblioteca), sin cambios de lógica.
2. Crear `app/games/[id]/page.tsx` con el contenido actual de `app/biblioteca/[id]/page.tsx`, actualizando el tipo `PageProps<"/games/[id]">` y el link "Volver al Vault" para que apunte a `/games`. Eliminar la carpeta `app/biblioteca/`.
3. Reescribir `app/page.tsx` como Client Component con la pantalla Home completa (hero, siluetas SVG, features, mini-rail, stats, actividad en vivo, precios/FAQ, CTA final), portada de `home.jsx`, con sub-componentes locales (`FloatingSilhouettes`, `MiniCard`, `FeatureIcon`) definidos en el mismo archivo. Los CTAs navegan con `next/link`/`useRouter` a: `/games` (Explorar juegos, Ver todos los juegos, Insertar moneda), `/auth` (Crear cuenta, Empezar gratis), `/salon` (Ver salón), `/games/[id]` (click en cada `MiniCard`). El scroll-reveal se implementa con `useEffect` + `IntersectionObserver` sobre los elementos `.reveal`, igual que en el template.
4. Añadir a `app/globals.css` las reglas CSS de los bloques `HOME PAGE`, `ACTIVITY` y `PRICING` de `references/templates/home-about/styles.css` (incluyendo `@keyframes float` y las clases `.reveal` / `.reveal.in`), al final del archivo, sin tocar reglas existentes.
5. Actualizar `components/nav.tsx`: agregar link "Inicio" (`href="/"`) antes de "Biblioteca" en el nav de escritorio y en el panel móvil; cambiar el `href` de "Biblioteca" a `/games`; actualizar `isActive` para que `"inicio"` esté activo solo cuando `pathname === "/"` y `"biblioteca"` esté activo en `/games`, `/games/[id]` y `/jugar/[id]`.
6. Actualizar `components/game-card.tsx`: `goToDetail` navega a `/games/${game.id}` en vez de `/biblioteca/${game.id}`.
7. Actualizar `app/jugar/[id]/page.tsx`: el botón "SALIR" enlaza a `/games/${game.id}`; el botón "VOLVER AL VAULT" del modal de fin de juego enlaza a `/games`.
8. Actualizar `app/auth/page.tsx`: el submit del formulario y el botón "JUGAR COMO INVITADO" navegan a `/games` en vez de `/`.
9. Smoke test manual con `next dev`: verificar que `/` muestra el Home completo con sus animaciones de scroll-reveal, que el Nav muestra "Inicio" antes de "Biblioteca" con el resaltado activo correcto en las 6 rutas (`/`, `/games`, `/games/[id]`, `/jugar/[id]`, `/salon`, `/auth`), que todos los CTAs del Home navegan a donde corresponde, que `/biblioteca/*` ya no existe, confirmar ausencia de errores/warnings en consola (incluyendo hidratación), y correr `tsc --noEmit` sin errores.

## Criterios de aceptación

- [ ] `/` muestra la pantalla Home completa (hero, siluetas flotantes, features, mini-rail de juegos, stats, actividad en vivo, precios/FAQ, CTA final), reemplazando el contenido actual de la Biblioteca.
- [ ] Las secciones marcadas `reveal` en el Home aparecen animadas al hacer scroll (clase `.in` añadida vía `IntersectionObserver`).
- [ ] `/games` muestra la Biblioteca completa (hero + buscador + chips + grid), igual que antes en `/`.
- [ ] `/games/[id]` muestra el Detalle del juego (mismo contenido que antes en `/biblioteca/[id]`); un `id` inexistente devuelve 404.
- [ ] `/biblioteca` y `/biblioteca/[id]` ya no existen como rutas.
- [ ] El Nav muestra "Inicio" antes de "Biblioteca", tanto en escritorio como en el menú móvil.
- [ ] "Inicio" navega a `/` y se resalta como activo solo en `/`.
- [ ] "Biblioteca" navega a `/games` y se resalta como activo en `/games`, `/games/[id]` y `/jugar/[id]`.
- [ ] El logo del Nav navega a `/` (Home).
- [ ] En el Home: "Explorar juegos", "Ver todos los juegos" e "Insertar moneda" navegan a `/games`; "Crear cuenta" y "Empezar gratis" navegan a `/auth`; "Ver salón" navega a `/salon`; cada `MiniCard` navega a `/games/[id]` correspondiente.
- [ ] Las tarjetas de la Biblioteca (`GameCard`) enlazan a `/games/[id]`.
- [ ] "Volver al Vault" (en Detalle y en el modal de fin de juego del Reproductor) navega a `/games`.
- [ ] "Salir" en el Reproductor navega a `/games/[id]` del juego actual.
- [ ] Enviar el formulario de Auth o pulsar "Jugar como invitado" navega a `/games`.
- [ ] `tsc --noEmit` no reporta errores.
- [ ] No hay errores ni warnings en la consola del navegador (incluyendo hidratación) al navegar por las 6 pantallas.

## Decisiones tomadas y descartadas

- **`/` pasa a ser la pantalla Home (landing)** y la Biblioteca se mueve a `/games` — decisión explícita del usuario, revierte la decisión de la spec 01 ("`/` es la Biblioteca completa") ahora que se agrega una landing real. Se descarta mantener Home en una ruta separada tipo `/inicio` por pedido directo del usuario.
- **La ruta de Biblioteca es `/games` (no `/biblioteca`)** — decisión explícita del usuario. El detalle se mueve en consecuencia a `/games/[id]` por consistencia (confirmado por el usuario), y `/jugar/[id]` no cambia de ruta.
- **No se incluye la pantalla "Acerca de"** (`about.jsx`) en esta spec — decisión explícita del usuario; solo se implementa el Home. Queda disponible como spec futura si se necesita.
- **"Volver al Vault" y los flujos de Auth navegan a `/games`, no a `/`** — ahora que `/` es la landing y no la biblioteca, mantener el comportamiento original de "volver a jugar/explorar" requiere apuntar a `/games` en vez de `/`. Se descarta dejarlos apuntando a `/` porque llevaría al usuario de vuelta a la landing en lugar de a la biblioteca.
- **Las clases CSS del Home se añaden a `app/globals.css`** (bloques `HOME PAGE`, `ACTIVITY` y `PRICING` del `styles.css` del template) — confirmado por el usuario. Es una adición pura (ninguna regla existente se modifica), por lo que no contradice la decisión de la spec 01 de no tocar el tema ya migrado.
- **Los datos mock de "Actividad en vivo" y "Top jugadores" se mantienen hardcodeados dentro de `app/page.tsx`**, sin migrarlos a `lib/data.ts` — igual que en el template, ya que no se reutilizan en ninguna otra pantalla.
- **Home es un Client Component** (usa `useState`/`useEffect` para el scroll-reveal), consistente con el resto de pantallas interactivas del proyecto.

## Riesgos identificados

- Mover `/biblioteca/[id]` a `/games/[id]` cambia una URL pública; cualquier enlace externo o marcador hacia `/biblioteca/*` quedará roto (aceptable en este MVP sin usuarios reales todavía).
- El `IntersectionObserver` del scroll-reveal corre solo en cliente; si el usuario entra con JavaScript deshabilitado, las secciones `.reveal` quedarían con `opacity: 0` de forma permanente. Sin mitigación en este MVP (mismo comportamiento que el template original).
