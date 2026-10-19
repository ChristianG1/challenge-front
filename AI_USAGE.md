# Uso de Inteligencia Artificial

> ✍️ _Borrador generado durante la sesión. Revísalo y complétalo con tu propia voz antes de enviarlo: las secciones marcadas con **[completar]** son tuyas._

## 1. Herramientas y en qué partes

| Herramienta | Uso |
| --- | --- |
| **Claude Code** (Claude Opus) | Análisis del PDF, propuesta de arquitectura, generación del código (dominio, servicios, API Routes, UI, tests unitarios y E2E) y borradores de README, DECISIONS y este archivo |
| _[completar si usaste otras: Copilot, ChatGPT, etc.]_ | |

Forma de trabajo: primero analizamos el challenge y discutimos las decisiones (router, rendering, estado, dónde viven las reglas, testing). Después la IA implementó por capas y yo revisé cada parte, la probé en el navegador y pedí cambios.

## 2. Qué acepté, qué corregí y qué rechacé

**Acepté (después de revisarlo):**
- La separación `domain / server / features / components`, con las reglas de negocio como funciones puras validadas en cliente y servidor.
- El dinero en centavos enteros con tipo "branded".
- La máquina de estados con `useReducer` para el flujo de transferencia, en lugar de una librería de estado global.
- El `Idempotency-Key` para reintentos seguros.
- Vitest + Testing Library para unit tests y Playwright para E2E.

**Corregido durante el desarrollo:**
- **Next.js 16 cambió APIs:** `middleware.ts` ahora es `proxy.ts`, `error.tsx` recibe `retry` y Cache Components obliga a leer cookies dentro de `<Suspense>`. Hubo que leer la documentación incluida en `node_modules/next/dist/docs` en lugar de confiar en el conocimiento previo de la IA.
- **Compatibilidad de versiones:** Vitest 5 y jsdom 30 requieren una versión de Node más nueva que la mía (22.0). Se bajó a Vitest 3 y jsdom 25.
- **Bug visual:** en móvil los botones de los estados de error se aplastaban (`flex-1` dentro de una columna). Se detectó probando en el navegador y se corrigió.
- **Reintento del Home:** el error boundary no se reseteaba al quitar `?simulate=error`, porque solo cambiaban los searchParams. Se corrigió combinando navegación con `retry()`.
- **Selectores E2E:** fallaban por el `role="alert"` del route announcer de Next y por las rutas que `<Activity>` mantiene montadas pero ocultas. Se acotaron los selectores.
- **Demo de escenarios:** el selector de escenario se movió para que también aparezca en la pantalla de error. Así se puede probar "error de red → reintentar con éxito".
- **Entorno:** con el disco casi lleno, Playwright no podía descargar Chromium. Se configuró para usar el Chrome instalado (`channel: "chrome"`).

**Rechacé:**
- Copiar elementos del diseño de referencia del login que no están en el alcance del PDF (registro, passkey, captcha). Agregar botones que no funcionan resta credibilidad.
- _[completar con lo que tú hayas rechazado]_

## 3. Decisiones que tomé yo (no la IA)

- Postular a nivel **senior** y, en consecuencia, invertir en idempotencia, manejo exhaustivo de errores y tests E2E de los 5 escenarios.
- Usar **Tailwind**.
- **Acotar el tiempo** a ~2 horas y priorizar: primero los requisitos del PDF, después tests y documentación.
- El **diseño del login** en dos columnas (formulario + panel de marca), inspirado en una referencia que elegí.
- _[completar: por qué aceptaste cada decisión de la tabla de DECISIONS.md, qué cambiarías, etc.]_

## 4. Cómo verifiqué el código generado

- `pnpm typecheck`, `pnpm lint`, `pnpm test` (69 tests) y `pnpm test:e2e` (16 tests) pasando.
- Prueba manual en el navegador (móvil y desktop) del login, el Home y el flujo de transferencia.
- Llamadas directas al API con `curl`, para confirmar que las reglas de negocio se aplican en el servidor y que la idempotencia devuelve el mismo comprobante.
