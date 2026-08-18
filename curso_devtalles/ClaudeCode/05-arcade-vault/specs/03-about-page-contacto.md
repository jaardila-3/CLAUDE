# 03 — Página "Acerca de" con formulario de contacto vía Resend

**Estado:** Approved
**Depende de:** SPEC 02
**Fecha:** 2026-08-18

**Objetivo:** Implementar la ruta `/about` (pantalla "Acerca de" + formulario de contacto) idéntica visualmente a `references/templates/home-about/about.jsx`, enlazarla desde el Nav, y conectar el envío del formulario a un correo real usando Resend a través de un Server Action.

## Alcance

**Incluido:**

- Nueva ruta `/about` (Client Component): hero "Acerca de" (kicker, título, misión, fila de 3 highlights con iconos pixel-art), separador decorativo animado, y sección de contacto (intro + formulario), todo tal como aparece en `about.jsx`, incluyendo el `IntersectionObserver` de scroll-reveal sobre `.reveal`.
- Link "Acerca de" agregado al Nav (`components/nav.tsx`), tanto en el nav de escritorio como en el panel móvil, apuntando a `/about` y resaltado como activo en esa ruta.
- Formulario de contacto (NOMBRE, CORREO ELECTRÓNICO, MENSAJE) controlado con `useState`, igual que en el template: campos vacíos disparan la animación `shake` sin enviar nada.
- Envío real de correo vía Resend al confirmar el formulario, mediante un Server Action (`app/about/actions.ts`):
  - `from`: `onboarding@resend.dev` (remitente de pruebas de Resend, fijo en el código).
  - `reply-to`: el correo que el visitante escribió en el campo CORREO ELECTRÓNICO.
  - `to`: `process.env.CONTACT_TO_EMAIL`.
  - `subject` y `text`/`body`: incluyen el nombre y el mensaje ingresados.
- Estado de éxito: idéntico al template — reemplaza el formulario por el bloque `terminal-success` con el nombre del remitente, y botón "ENVIAR OTRO MENSAJE" que resetea el formulario.
- Estado de error nuevo (no existe en el template, porque ahí el envío era decorativo): si el Server Action falla (API key inválida, error de red, error de Resend), se muestra un mensaje de error inline en el formulario, sin borrar los datos ingresados, para que el usuario pueda reintentar.
- Estado de carga: el botón "ENVIAR MENSAJE" se deshabilita y cambia su texto mientras la petición a Resend está en curso.
- Clases CSS de la sección `ABOUT PAGE` de `references/templates/home-about/styles.css` (bloque completo: `.about`, `.about-hero`, `.about-title`, `.about-mission`, `.highlight-row`/`.highlight`, `.about-divider`/`.div-bar`/`.div-pixels` + `@keyframes pxblink`, `.about-contact`/`.contact-grid`/`.contact-intro`/`.contact-title`/`.contact-sub`/`.contact-tips`, `.contact-form` + `.shake` + `@keyframes shake`, `.btn.press:active`, `.terminal-success`/`.term-bar`/`.term-body` + sus sub-clases) añadidas a `app/globals.css`, sin modificar reglas existentes.
- Una clase CSS nueva y mínima `.contact-error` (no está en el template) para el estado de error del envío real, reutilizando los tokens de color existentes (`--magenta`) para mantener coherencia visual con el resto del tema.
- Dependencia `resend` (SDK oficial) agregada a `package.json`.
- Variables de entorno `RESEND_API_KEY` y `CONTACT_TO_EMAIL` en `.env.local` (no versionado). `CONTACT_TO_EMAIL=alexanderardila03@gmail.com`. `RESEND_API_KEY` se deja vacío en esta spec — el usuario proporcionará la key real más adelante.

**No incluido:**

- Verificación de dominio propio en Resend — se usa el remitente de pruebas `onboarding@resend.dev` hasta que el usuario decida configurar uno propio.
- Persistencia de los mensajes de contacto (no se guardan en base de datos ni en archivo; solo se envían por correo).
- Rate limiting, protección anti-spam (honeypot, captcha) o validación avanzada de formato de correo más allá de `type="email"` del input.
- Cambios a otras rutas (`/`, `/games`, `/games/[id]`, `/jugar/[id]`, `/salon`, `/auth`) más allá de agregar el link "Acerca de" en `components/nav.tsx`.
- Autenticación o asociar el mensaje de contacto a un usuario logueado (sigue sin existir ese concepto en el MVP).
- Copiar el bloque CSS `GAMEPAD` (`.gp-*`, `.ab-*`) de `styles.css` — no lo usa ningún componente de `home-about/` (queda huérfano en el template), así que no se porta.

## Modelo de datos

No se introduce persistencia. El único "dato" nuevo es el payload que viaja del formulario al Server Action:

```ts
type ContactPayload = {
  name: string;
  email: string;
  msg: string;
};

type ContactResult = { ok: true } | { ok: false; error: string };
```

`ContactResult` es el valor de retorno de `sendContactMessage` en `app/about/actions.ts`, usado por `app/about/page.tsx` para decidir entre mostrar el estado de éxito (`terminal-success`) o el mensaje de error inline.

## Variables de entorno

| Variable           | Valor en `.env.local`                  | Uso                                                                                                |
| ------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`   | _(vacío — lo agrega el usuario luego)_ | API key de Resend, usada solo en `app/about/actions.ts` (server-only, nunca se expone al cliente). |
| `CONTACT_TO_EMAIL` | `alexanderardila03@gmail.com`          | Dirección que recibe los mensajes del formulario de contacto.                                      |

## Plan de implementación

1. Agregar `resend` a las dependencias de `package.json` e instalar (`npm install resend`).
2. Crear `.env.local` en la raíz del proyecto con `RESEND_API_KEY=` (vacío) y `CONTACT_TO_EMAIL=alexanderardila03@gmail.com`. Confirmar que `.gitignore` ya excluye `.env*` (lo hace).
3. Crear `app/about/actions.ts` con la directiva `'use server'` y la función `sendContactMessage(payload: ContactPayload): Promise<ContactResult>`: valida que `name`, `email` y `msg` no estén vacíos tras `trim()` (defensa en el servidor); instancia `new Resend(process.env.RESEND_API_KEY)`; llama a `resend.emails.send({ from: "onboarding@resend.dev", to: process.env.CONTACT_TO_EMAIL!, replyTo: payload.email, subject: ..., text: ... })` dentro de un `try/catch`; retorna `{ ok: true }` en éxito o `{ ok: false, error: "..." }` (mensaje genérico, sin exponer detalles internos de Resend) en fallo.
4. Crear `app/about/page.tsx` como Client Component, portando `about.jsx` casi 1:1 a TSX: mismo hero, mismo `highlight-row` con `HighlightIcon` (componente local, mismos SVGs pixel-art), mismo separador `about-divider`, y misma sección de contacto con `useReveal`-equivalente (`useEffect` + `IntersectionObserver` sobre `.reveal`, igual patrón que en `app/page.tsx`).
   - Estado local: `form` (name/email/msg), `sent` (nombre del último envío exitoso), `shake` (boolean), `pending` (boolean), `error` (string | null).
   - `onSubmit`: `preventDefault`; si algún campo está vacío tras `trim()`, dispara `shake` (igual que el template) y no llama al Server Action; si hay datos, limpia `error`, activa `pending`, llama `await sendContactMessage(form)`, y según el resultado: éxito → `setSent(...)` (igual que el template); error → `setError(result.error)` sin tocar `form` (los datos quedan intactos para reintentar); en ambos casos desactiva `pending` al final.
   - Botón de envío: texto "▶ ENVIAR MENSAJE" normalmente, "ENVIANDO…" y `disabled` mientras `pending` es `true`.
   - Debajo del formulario (o del botón), si `error` no es `null`, renderiza `<div className="contact-error">{error}</div>`.
5. Modificar `components/nav.tsx`: agregar `Link href="/about"` con texto "Acerca de" tanto en `.links` (desktop) como en el panel móvil; extender el tipo de `isActive` para incluir `"about"` y su condición (`pathname.startsWith("/about")`).
6. Añadir a `app/globals.css` el bloque CSS `ABOUT PAGE` completo descrito en el alcance (portado literalmente de `styles.css`, líneas de la sección `/* ===== ABOUT PAGE ===== */`), más la nueva regla `.contact-error` al final de ese bloque, sin tocar reglas existentes.
7. Smoke test manual con `next dev`: navegar a `/about` desde el link del Nav (desktop y móvil), confirmar que se ve idéntico al template (hero, highlights, divisor animado, formulario); enviar el formulario vacío y confirmar el `shake`; enviar el formulario con `RESEND_API_KEY` vacío y confirmar que aparece el mensaje de error (comportamiento esperado hasta que el usuario configure la key real) sin perder los datos escritos; confirmar que "Acerca de" se resalta como activo en `/about` y en ninguna otra ruta; confirmar ausencia de errores/warnings de consola (incluyendo hidratación); correr `tsc --noEmit` sin errores.

## Criterios de aceptación

- [ x] `/about` existe como ruta real y muestra el hero "Acerca de" (kicker, título, misión, 3 highlights) igual que `about.jsx`.
- [ x] El separador animado y la sección de contacto aparecen con la animación `reveal`/`in` al hacer scroll.
- [ x] El link "Acerca de" está visible en el Nav de escritorio y en el panel móvil, apunta a `/about`, y se resalta como activo solo en esa ruta.
- [ x] Enviar el formulario con algún campo vacío dispara la animación `shake` y no invoca a Resend.
- [ x] Enviar el formulario con todos los campos completos invoca `sendContactMessage`, que llama a la API de Resend con `from: onboarding@resend.dev`, `replyTo` igual al correo ingresado, y `to` igual a `CONTACT_TO_EMAIL`.
- [ x] Con un envío exitoso, el formulario es reemplazado por el bloque `terminal-success` con el nombre ingresado; "ENVIAR OTRO MENSAJE" vuelve a mostrar el formulario vacío.
- [ x] Con un envío fallido (por ejemplo, `RESEND_API_KEY` vacío o inválido), se muestra un mensaje de error inline y los datos del formulario permanecen intactos para reintentar.
- [ x] Mientras la petición está en curso, el botón de envío muestra un estado de carga y queda deshabilitado.
- [ x] `RESEND_API_KEY` y `CONTACT_TO_EMAIL` solo se leen en `app/about/actions.ts` (servidor); no aparecen en ningún bundle de cliente.
- [ x] `tsc --noEmit` no reporta errores.
- [ x] No hay errores ni warnings en la consola del navegador (incluyendo hidratación) al navegar a `/about` y usar el formulario.

## Decisiones tomadas y descartadas

- **Ruta `/about`** (no `/acerca-de`) — decisión explícita del usuario; coincide con el nombre del archivo template y con la convención en inglés ya usada en `/games` y `/auth`.
- **Se agrega el link "Acerca de" al Nav** (desktop y móvil) — decisión explícita del usuario; revierte la exclusión de la spec 02, que dejaba la pantalla "Acerca de" fuera de alcance.
- **Remitente fijo `onboarding@resend.dev`, con `reply-to` igual al correo del visitante** — decisión técnica explicada y aprobada por el usuario: Resend no permite usar como `from` una dirección arbitraria no verificada (el pedido inicial del usuario de usar el correo del formulario como remitente no es técnicamente viable); `reply-to` logra el mismo objetivo práctico (responder le llega al visitante) sin violar las restricciones de Resend. Se descarta intentar poner el correo del visitante como `from`.
- **`CONTACT_TO_EMAIL=alexanderardila03@gmail.com`** — decisión explícita del usuario como destinatario de los mensajes de contacto.
- **Server Action invocado desde un event handler (`onSubmit` con `await sendContactMessage(form)`)**, no mediante `<form action={...}>` — para preservar exactamente la lógica de validación cliente del template (el `shake` en campos vacíos ocurre antes de tocar el servidor, igual que en `about.jsx`). Se descarta `useActionState`/`<form action>` porque cambiaría el flujo de validación del template sin necesidad.
- **`RESEND_API_KEY` se deja vacío en `.env.local`** — decisión explícita del usuario ("la api key... la proporciono después"); el envío fallará mostrando el nuevo estado de error hasta que se configure la key real. No es un bug de esta spec.
- **Se agrega un estado de error nuevo** (`.contact-error`, no existe en el template) — necesario porque el template nunca falla (el envío era decorativo/siempre exitoso); con Resend real, el fallo es un caso posible que debe comunicarse sin perder los datos del formulario.
- **No se copia el bloque CSS `GAMEPAD`** (`.gp-*`, `.ab-*`) de `styles.css` — no lo usa ningún componente dentro de `references/templates/home-about/`, por lo que portarlo agregaría CSS muerto.
- **No se crea `.env.example`** — el `.gitignore` del proyecto ignora todo `.env*` de forma amplia; en vez de modificar esa regla, las variables requeridas quedan documentadas en esta spec.

## Riesgos identificados

- Mientras `RESEND_API_KEY` esté vacío, todo envío real fallará y mostrará el estado de error — comportamiento esperado hasta que el usuario configure la key.
- `onboarding@resend.dev` es un remitente de pruebas con límites de uso y de reputación de entrega impuestos por Resend; para un uso más allá de pruebas se recomienda verificar un dominio propio (fuera de alcance de esta spec).
- El Server Action es un endpoint POST alcanzable directamente (no solo desde el formulario del Nav); no requiere autenticación por diseño (es un formulario de contacto público), pero no tiene rate limiting, por lo que es susceptible a spam si se descubre. Aceptable para este MVP sin usuarios reales todavía.
