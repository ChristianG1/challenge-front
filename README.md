# Mini Wallet — Web Challenge

Web app en **Next.js 16 (App Router) + TypeScript** que simula el flujo básico de una wallet:

**Login → Home → Nueva transacción → Confirmación / Comprobante**

Todos los datos están mockeados en memoria y se exponen a través de **API Routes** (Route Handlers).

> ⏱️ **Tiempo invertido:** _completar con el tiempo real_ (aprox. 2 h).

---

## Requisitos

- Node.js **≥ 20.9** (probado con Node 22)
- pnpm 10 (`corepack enable` lo activa)
- Google Chrome instalado (para los E2E; ver nota abajo)

## Cómo levantarlo

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Build de producción:

```bash
pnpm build && pnpm start
```

## Scripts

| Script | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` / `pnpm start` | Build y servidor de producción |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Tests unitarios y de componentes (Vitest + Testing Library) |
| `pnpm test:e2e` | Tests E2E (Playwright). Levanta un build de producción en el puerto 3100 |

> **E2E y navegador:** por defecto Playwright usa el **Google Chrome instalado** (`channel: "chrome"`), así no hay que descargar navegadores. Para usar el Chromium de Playwright: `pnpm exec playwright install chromium` y `PW_CHANNEL= pnpm test:e2e`.

## Cómo probarlo

### Cuentas demo (login)

| Identificador | Resultado |
| --- | --- |
| `demo@spin.mx` o `5512345678` | Cuenta con saldo, favoritos y movimientos |
| `nuevo@spin.mx` | Cuenta sin movimientos ni contactos (**estado vacío**) |
| `error@spin.mx` | Simula un error del servidor en el login (**estado de error**) |
| Cualquier otro válido | "No encontramos una cuenta" |

### Navegación

- Desktop: pestañas **Inicio / Enviar** y menú de cuenta en el avatar (ocultar saldo, cerrar sesión).
- Móvil: barra inferior **Inicio · Enviar · Cuenta**.

### Home

- **Saldo** con botón para ocultarlo. La preferencia se guarda en cookie y se lee en el servidor, así que el saldo oculto nunca se muestra ni por un instante.
- **Envío rápido:** los favoritos abren "Nueva transacción" con el destinatario ya elegido (`/transfer?to=<id>`).
- **Tendencia de 30 días** del saldo y variación contra hace 30 días.
- **Resumen del mes** (entró / salió) y **movimientos agrupados por día** con filtros Todos / Entradas / Salidas.
- **Paginado por cursor:** "Ver más movimientos" carga de 10 en 10 (`GET /api/movements?cursor=…&direction=…`).

### Estados del Home

- **Carga:** skeletons por sección (streaming con Suspense).
- **Vacío:** iniciar sesión con `nuevo@spin.mx`.
- **Error:** abrir `/home?simulate=error` y pulsar **Reintentar**.

### Escenarios de confirmación

Por defecto el resultado es **aleatorio** (éxito más probable). En el paso de confirmación hay un selector **"Modo demo"** para forzar uno:

| Escenario | Respuesta del API | UI |
| --- | --- | --- |
| Éxito | `201` + comprobante | Comprobante con folio, fecha, destinatario y saldo |
| Error de red | `503 SERVICE_UNAVAILABLE` (o `fetch` fallido) | Error con **Reintentar** (idempotente) |
| Fondos insuficientes | `422 INSUFFICIENT_FUNDS` | Error descriptivo + **Cambiar monto** |
| Timeout | El servidor tarda 15 s; el cliente aborta a los 8 s | Aviso "está tardando" a los 3 s y luego estado de timeout con **Reintentar** |
| Error desconocido | `500 INTERNAL_ERROR` | Fallback genérico |

El escenario también se puede forzar con el header `x-mock-scenario` (así lo usan los E2E).

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/auth/login` | `{ identifier }` → crea la sesión (cookie `httpOnly`) |
| `POST` | `/api/auth/logout` | Cierra la sesión |
| `GET` | `/api/account` | Nombre y saldo |
| `GET` | `/api/movements?limit=&cursor=&direction=&simulate=error` | Movimientos paginados por cursor (`{ movements, nextCursor }`) |
| `GET` / `POST` | `/api/contacts` | Lista / crea contacto `{ name, handle, favorite }` |
| `POST` | `/api/transfers` | `{ amount (centavos), recipientId }` + header `Idempotency-Key` |

Errores con forma uniforme: `{ "error": { "code": "INSUFFICIENT_FUNDS", "message": "..." } }`.

## Estructura

```
src/
  app/                    Rutas (App Router)
    login/                Login (CSR form + redirección server-side si ya hay sesión)
    (app)/                Rutas autenticadas: layout con header + logout (Server Action)
      home/               SSR + streaming, loading/empty/error
      transfer/           SSR de datos iniciales + flujo interactivo en cliente
    api/                  Route Handlers (capa HTTP delgada)
  domain/                 Modelos, reglas de negocio y contratos (Zod). Sin React ni Next
  server/                 Solo servidor: sesión, servicios, mock DB, helpers HTTP
  features/               UI + hooks por feature (auth, home, transfer)
  components/ui/          Componentes reutilizables (Button, TextField, Card, ...)
  lib/http/               Cliente HTTP tipado (timeout, errores como valores)
  proxy.ts                Chequeo optimista de sesión (antes "middleware")
e2e/                      Tests Playwright
```

Las decisiones de diseño están en **[DECISIONS.md](./DECISIONS.md)** y el uso de IA en **[AI_USAGE.md](./AI_USAGE.md)**.

## Librerías

| Librería | Uso |
| --- | --- |
| next 16, react 19 | Framework (App Router, Cache Components / PPR, Server Actions) |
| tailwindcss 4 | Estilos |
| zod 4 | Validación de contratos en el borde (requests y responses) |
| vitest 3, @testing-library/react, jsdom | Tests unitarios, de hooks/reducer y de componentes |
| @playwright/test | Tests E2E |
| server-only | Evita importar código de servidor en el cliente |

No se usa librería de estado global (ver DECISIONS.md).

## Limitaciones conocidas

- **Persistencia en memoria:** al reiniciar el servidor se pierden sesiones, transferencias y contactos nuevos (el usuario vuelve al login). En serverless con varias instancias el estado no se compartiría.
- **Autenticación mock:** el login no tiene contraseña ni OTP; la sesión es un token opaco en cookie `httpOnly`, sin firma ni rotación.
- **Idempotencia simplificada:** solo se guardan las transferencias exitosas. No hay estado "en proceso", así que dos requests concurrentes con la misma key no se deduplican (en el mock el commit es atómico, pero en un sistema real haría falta un lock o una tabla de idempotencia).
- El selector "Modo demo" y el header `x-mock-scenario` existen solo para la evaluación; en producción no se expondrían.
- Solo español (es-MX) y moneda MXN.
