# CLAUDE.md

Este archivo brinda guía a Claude Code (claude.ai/code) al trabajar con código en este repositorio.

@AGENTS.md

## Proyecto

Arcade Vault — una plataforma para jugar en línea y competir por la mayor cantidad de puntos. El código actualmente es un scaffold recién generado con `create-next-app` (Next.js 16.3.1, App Router, React 19.2.8, TypeScript, Tailwind CSS v4); todavía no existen funcionalidades de juegos ni de puntajes.

## Comandos

- `npm run dev` — inicia el servidor de desarrollo (también regenera el bloque de advertencia de Next.js en `AGENTS.md`; ver más abajo)
- `npm run build` — build de producción
- `npm run start` — ejecuta el build de producción
- `npm run lint` — ESLint (flat config, reglas `eslint-config-next` core-web-vitals + typescript)

Este repositorio aún no tiene un test runner configurado.

## Nota sobre la versión de Next.js

Este repo fija `next@16.3.1`, una versión más reciente que la mayoría de los datos de entrenamiento. Antes de escribir código que use APIs o convenciones de Next.js, lee la guía correspondiente en `node_modules/next/dist/docs/` (secciones: `01-app`, `02-pages`, `03-architecture`, `04-community`) — no asumas que aplican convenciones de versiones anteriores de Next.js. El bloque de importación en `AGENTS.md` es regenerado por `next dev`; mantenlo en el commit en lugar de quitarlo de los diffs.

## Arquitectura

- Solo App Router, con raíz en `app/` (`app/layout.tsx`, `app/page.tsx`, `app/globals.css`). No hay directorio `pages/`, ni route groups/segments más allá de la raíz por ahora.
- El alias de rutas `@/*` apunta a la raíz del repo (ver `tsconfig.json`).
- El estilado usa Tailwind CSS v4 vía `@tailwindcss/postcss` (no hay archivo `tailwind.config.*` — v4 es CSS-first, configurado en `app/globals.css`).
- Las fuentes se cargan vía `next/font/google` (Geist / Geist Mono) en `app/layout.tsx`.

## Flujo de trabajo: Spec Driven Design

Este proyecto sigue desarrollo guiado por especificaciones (spec-driven) usando el flujo `/spec` y `/spec-impl` de `Klerith/fernando-skills` (instalado vía `npx skills@latest add Klerith/fernando-skills`). Prefiere escribir/actualizar una spec antes de implementar funcionalidades no triviales, según las convenciones de ese set de skills.
