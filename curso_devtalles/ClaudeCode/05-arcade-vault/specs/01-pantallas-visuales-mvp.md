# 01 — Pantallas visuales MVP de Arcade Vault

**Estado:** aprobado
**Depende de:** Ninguna
**Fecha:** 2026-08-17

**Objetivo:** Implementar como rutas reales de Next.js App Router las 5 pantallas visuales de Arcade Vault descritas en `references/templates/` (Biblioteca, Detalle de juego, Reproductor, Autenticación y Salón de la Fama), sin ninguna lógica de juego real.

## Alcance

**Incluido:**

- 5 rutas reales bajo `app/`: `/` (Biblioteca), `/biblioteca/[id]` (Detalle), `/jugar/[id]` (Reproductor), `/salon` (Salón de la Fama), `/auth` (Autenticación).
- `Nav` persistente (logo, links Biblioteca/Salón de la Fama, contador de créditos estático, botón "Iniciar Sesión", menú hamburguesa móvil) y footer estático, ambos insertados en `app/layout.tsx`.
- Biblioteca (`/`): hero con título parpadeante, buscador por título, chips de categoría, grid de tarjetas de juego (`GameCard`) con efecto de inclinación al pasar el mouse, cada tarjeta enlaza al detalle.
- Detalle (`/biblioteca/[id]`): portada, tags, descripción, stat-strip (partidas / mejor global / dificultad), leaderboard con 10 filas generadas por `seededScores`, botones "Jugar ahora" y "Volver al Vault".
- Reproductor (`/jugar/[id]`): HUD con valores de ejemplo fijos (puntuación, vidas, nivel), arena CRT decorativa animada por CSS, botones Pausa (alterna overlay "EN PAUSA") y Fin (abre modal de fin de juego), modal con botón "Guardar puntuación" decorativo y "Jugar de nuevo" (resetea los toggles), botón "Salir".
- Autenticación (`/auth`): tabs Iniciar sesión / Crear cuenta, formulario (usuario, correo solo en modo registro, contraseña), botones sociales decorativos, botón "Jugar como invitado". El submit y "Jugar como invitado" navegan a `/`.
- Salón de la Fama (`/salon`): tabs por juego, podio (top 3) y tabla de ranking con `seededScores`, todo recalculado al cambiar de tab.
- `lib/data.ts`: módulo TypeScript tipado con `GAMES`, `CATS` y la función `seededScores`, migrado desde `references/templates/data.jsx`.

**No incluido:**

- Cualquier lógica de juego jugable (no hay input de jugador, colisiones, ni mecánica real).
- Autenticación real, backend, API routes o base de datos.
- Persistencia de sesión de usuario o de puntajes (no se escribe en `localStorage` en ningún flujo).
- Estado "con sesión iniciada" en el Nav (botón con nombre de usuario) — no existe concepto de usuario logueado en este MVP.
- Temporizadores, incrementos automáticos de puntaje o animaciones de score en el Reproductor.
- Cambios a `app/globals.css` o a la configuración de fuentes en `app/layout.tsx` — el tema visual completo ya fue migrado en un commit previo.
- Pantallas adicionales no presentes en `references/templates/` (perfil, ajustes, checkout de créditos, etc.).

## Modelo de datos

No se introduce persistencia ni base de datos; solo datos mock estáticos tipados en `lib/data.ts`, migrados 1:1 desde `references/templates/data.jsx`:

```ts
type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string; // clase CSS de portada (cover-bricks, cover-tetro, ...)
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
};

type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  date: string;
};

const GAMES: Game[];
const CATS: string[]; // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
function seededScores(seed: number, count?: number): ScoreRow[]; // función pura, determinística por seed
```

## Plan de implementación

1. Crear `lib/data.ts` con los tipos `Game`/`ScoreRow` y los datos migrados de `data.jsx` (`GAMES`, `CATS`, `seededScores`), tipados en TypeScript.
2. Crear `components/nav.tsx` (Client Component): logo enlazando a `/`, links "Biblioteca" y "Salón de la Fama" con `next/link` + `usePathname` para el estado activo (Biblioteca activo también en `/biblioteca/*` y `/jugar/*`), contador de créditos estático, botón "Iniciar Sesión" enlazando a `/auth`, menú hamburguesa móvil con panel deslizante (breakpoint < 840px, igual que `globals.css`).
3. Modificar `app/layout.tsx`: insertar `<Nav />` y el footer estático (copiado de `app.jsx`) dentro de `<div id="root">`, envolviendo `{children}` en un `<main className="av-main">`.
4. Reescribir `app/page.tsx` como Client Component: pantalla Biblioteca completa (hero + buscador + chips de categoría + grid), usando `components/game-card.tsx` (nuevo, Client Component con el efecto de inclinación por `onMouseMove`/`useRef`) y enlazando cada tarjeta a `/biblioteca/[id]`.
5. Crear `app/biblioteca/[id]/page.tsx` (Server Component): busca el juego en `GAMES` por `id` (params), llama `notFound()` si no existe, renderiza portada/tags/descripción/stat-strip/leaderboard (`seededScores`) y los botones "Jugar ahora" (`/jugar/[id]`) y "Volver al Vault" (`/`).
6. Crear `app/jugar/[id]/page.tsx` (Client Component): busca el juego en `GAMES`, `notFound()` si no existe; HUD con valores fijos de ejemplo; arena CRT decorativa; estado local (`useState`) para Pausa (overlay) y Fin (modal de fin de juego); modal con botón "Guardar puntuación" (decorativo, muestra el toast sin persistir) y "Jugar de nuevo" (resetea los toggles a su estado inicial); botón "Salir" navega a `/biblioteca/[id]`.
7. Crear `app/salon/page.tsx` (Client Component): tabs por juego (`GAMES`) con `useState`, podio top 3 y tabla de ranking recalculados con `seededScores` según el tab activo.
8. Crear `app/auth/page.tsx` (Client Component): tabs Iniciar sesión/Crear cuenta, formulario controlado, botones sociales decorativos; el submit y "Jugar como invitado" navegan a `/` vía `useRouter().push` sin persistir nada.
9. Smoke test manual con `next dev`: recorrer las 5 pantallas desde el Nav y los enlaces internos, probar buscador/chips, tabs de Salón, toggles de Reproductor, breakpoint móvil (< 840px), confirmar ausencia de errores/warnings en consola, y correr `tsc --noEmit` sin errores.

## Criterios de aceptación

- [ ] `/` muestra la Biblioteca completa (hero + buscador + chips + grid) y reemplaza el placeholder actual.
- [ ] El buscador filtra por título y los chips filtran por categoría en tiempo real, combinables entre sí.
- [ ] Cada `GameCard` enlaza a `/biblioteca/[id]` correspondiente.
- [ ] `/biblioteca/[id]` muestra la info del juego y un leaderboard con 10 filas generadas por `seededScores`.
- [ ] `/biblioteca/[id]` con un `id` inexistente devuelve 404 (`notFound`).
- [ ] "Jugar ahora" navega a `/jugar/[id]`; "Volver al Vault" navega a `/`.
- [ ] `/jugar/[id]` muestra un HUD con valores fijos que no cambian solos (sin temporizador).
- [ ] El botón Pausa muestra/oculta el overlay "EN PAUSA"; el botón Fin abre el modal de fin de juego.
- [ ] El modal de fin de juego permite "Guardar puntuación" (solo visual) y "Jugar de nuevo" (resetea los toggles).
- [ ] "Salir" navega de vuelta a `/biblioteca/[id]`.
- [ ] `/salon` muestra tabs por juego, podio (top 3) y tabla de ranking que cambian al seleccionar otro juego.
- [ ] `/auth` muestra tabs Iniciar sesión/Crear cuenta y el campo de correo solo aparece en el tab de registro.
- [ ] Enviar el formulario de Auth o pulsar "Jugar como invitado" navega a `/`.
- [ ] El Nav (logo, links, contador de créditos, botón "Iniciar Sesión") es visible y persistente en las 5 rutas, con el link activo resaltado correctamente.
- [ ] El menú hamburguesa funciona en viewport móvil (< 840px).
- [ ] Ningún flujo escribe en `localStorage` ni introduce un estado de "usuario logueado".
- [ ] `tsc --noEmit` no reporta errores.
- [ ] No hay errores ni warnings en la consola del navegador al navegar por las 5 pantallas.

## Decisiones tomadas y descartadas

- **Rutas reales de Next.js App Router**, en vez del router por hash (`location.hash` + `route` en estado) del template — aprovecha el App Router del proyecto y da URLs navegables. Se descarta el enrutador SPA por no encajar con las convenciones de Next.js de este repo.
- **Nombres de ruta en español** (`/biblioteca`, `/salon`, `/auth`, `/jugar`) — coincide con la terminología de la UI y el naming de los archivos template. Se descarta inglés para mantener consistencia con el copy existente.
- **`/` es la Biblioteca completa**, no un landing separado — igual que en el template, donde la librería es la pantalla de inicio. Se descarta un home decorativo aparte por duplicar contenido sin aportar valor al MVP.
- **Auth, "Guardar puntuación" y "Jugar como invitado" no persisten nada** (sin `localStorage`, sin estado de usuario global) — decisión explícita del usuario para mantener el alcance 100% visual sin simular un backend. Se descarta portar la lógica de `av_user`/`av_scores` del template.
- **El Nav nunca muestra el estado "con sesión iniciada"** (botón con nombre de usuario) — consecuencia directa de no persistir auth; ese estado queda fuera de alcance de este MVP.
- **Reproductor sin temporizador ni incremento automático de puntaje** — decisión explícita del usuario; Pausa/Fin siguen siendo toggles de estado local de UI (sin lógica de juego) para poder mostrar ambos estados de la pantalla.
- **HUD de Reproductor con valores de ejemplo fijos** en vez de ceros — para ilustrar mejor cómo se vería el HUD durante una partida.
- **`/biblioteca/[id]` (Detalle) como Server Component** — no requiere estado de cliente (sin buscador ni formularios). El resto de pantallas son Client Components por su interactividad (`useState`).
- **No se modifica `app/globals.css` ni la configuración de fuentes de `app/layout.tsx`** — el tema visual completo (variables CSS, Google Fonts vía `next/font`) ya fue migrado en el commit previo "Refactor layout and home page for Arcade Vault".
- **`lib/data.ts` como ubicación del módulo de datos mock** — convención estándar del proyecto, accesible vía el alias `@/lib/data`.

## Riesgos identificados

- `seededScores` es una función pura basada en un `seed` numérico derivado del `id` del juego, calculada tanto en el Server Component de Detalle como en el Client Component de Salón. Al ser determinística, no debería producir mismatches de hidratación, pero conviene confirmarlo explícitamente en el smoke test del paso 9 (sin warnings de "Hydration failed" en consola).
