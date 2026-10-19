# Decisiones de diseño

## 1. Estructura del proyecto

Organicé el código **por capas y por feature**:

| Capa | Responsabilidad | Depende de |
| --- | --- | --- |
| `domain/` | Modelos, reglas de negocio puras, contratos (Zod), dinero | Nada de React ni Next |
| `server/` | Sesión, servicios (casos de uso), mock DB, helpers HTTP | `domain` |
| `app/api/` | Route Handlers delgados: parsear → autorizar → llamar al servicio → mapear a HTTP | `server`, `domain` |
| `app/(pages)` | Composición de rutas, data fetching en Server Components, boundaries | `server`, `features` |
| `features/` | UI + hooks de cada flujo (auth, home, transfer) | `domain`, `lib`, `components` |
| `components/ui/` | Primitivos visuales sin lógica de negocio | — |

La regla es que **las dependencias apuntan hacia `domain`**. Por eso las reglas de negocio se pueden testear sin navegador ni servidor, y cambiar el mock por un backend real solo toca `server/`.

`server/*` importa `server-only`, así que importarlo por error en el cliente rompe el build.

## 2. Separación entre UI y lógica de negocio

- **Reglas de negocio** (`domain/transfer-rules.ts`): funciones puras `validateAmount`, `validateRecipient` y `validateTransfer`, que devuelven violaciones tipadas como unión discriminada.
- **Se ejecutan en los dos lados:**
  - En el **cliente**, para dar feedback inmediato y bloquear el avance entre pasos.
  - En el **servidor** (`transfer.service.ts`), como **fuente de verdad**: el API vuelve a validar aunque el cliente ya lo haya hecho. Hay un test que llama al servicio con un monto negativo, sin destinatario y por encima del saldo, como lo haría un cliente malicioso.
- **Flujo de transferencia como máquina de estados** (`transfer-machine.ts`): un reducer puro con estados `editing | submitting | failed | succeeded`. Los estados imposibles (por ejemplo, un comprobante mientras se edita) no se pueden representar, y las transiciones ilegales se ignoran: un doble click en "Confirmar" no puede disparar dos envíos.
- **Hook orquestador** (`use-transfer-flow.ts`): conecta el reducer, la validación por paso y la llamada al API. Los componentes solo renderizan estado y llaman acciones.
- **Errores como valores:** el cliente HTTP devuelve `Result<T, ApiFailure>` en lugar de lanzar. `toTransferFailure` traduce errores técnicos (HTTP o red) a errores de dominio, y `describeFailure` los traduce a copy. Los `switch` son exhaustivos, así que agregar un caso nuevo rompe la compilación hasta que se maneja.

## 3. Rendering: SSR, CSR o combinados

| Página | Estrategia | Por qué |
| --- | --- | --- |
| **Home** | **SSR con streaming** (Cache Components / PPR). El shell es estático y saldo y movimientos llegan en `<Suspense>` separados | Es sobre todo lectura. Evita un waterfall en el cliente, el usuario ve el layout de inmediato y cada sección tiene su skeleton. `error.tsx` cubre el estado de error |
| **Login** | Formulario **CSR** que llama a `POST /api/auth/login`. La redirección cuando ya hay sesión se hace en el servidor | Es interactivo (validación en vivo, estados de carga y error) |
| **Transfer** | **Híbrido**: el Server Component obtiene saldo y favoritos y se los pasa al flujo interactivo **CSR** | Los datos iniciales llegan sin spinner extra. El flujo de varios pasos es puramente interactivo |
| **Logout** | **Server Action** | Funciona como un `<form>` normal incluso antes de la hidratación |

**Los Server Components no llaman a nuestras propias API Routes por HTTP.** Llaman directo a la capa de servicios, que es la misma que usan los Route Handlers. Un `fetch` al propio servidor durante el render agrega una ida y vuelta de red sin aportar nada. Las API Routes son el contrato para el cliente (y para otros clientes, como una app móvil).

Después de una transferencia exitosa, `router.refresh()` vuelve a renderizar los datos del servidor, así que el saldo y los movimientos ya están actualizados al volver al Home.

### Diseño del Home

Lo basé en patrones de wallets como Revolut, Nubank, Cash App y Mercado Pago: un hero oscuro (el mismo lenguaje que el login) con el saldo como protagonista y una hoja blanca con la actividad. Solo incluí acciones que funcionan de verdad: ocultar saldo, envío rápido a favoritos y filtros. No agregué botones de relleno como "Recargar" o "Pagar servicios".

- **"Hoy / Ayer" con zona horaria fija** (`America/Mexico_City`): el servidor pasa `now` al componente cliente y la agrupación usa esa zona, así el SSR y la hidratación coinciden aunque el servidor esté en UTC.
- **El resumen del mes se calcula sobre todos los movimientos del mes**, no solo sobre la página reciente. Es una función pura en `domain/movements.ts`, con tests.
- **Tendencia del saldo (30 días)** reconstruida con una función pura (`balanceTrend`): parte del saldo actual y deshace los movimientos día por día. La gráfica es un SVG generado en el servidor, sin librería de charts.
- **`await connection()`** antes de usar la fecha actual: con Cache Components, Next exige marcar explícitamente lo que depende del momento de la petición para no prerenderizarlo.
- **Paginado por cursor** (keyset sobre `createdAt` + `id`) con "Ver más movimientos". Un cursor opaco evita duplicados y saltos si llegan movimientos nuevos mientras se pagina, cosa que sí pasaría con `?page=2`. Los filtros se aplican en el servidor, y cada filtro mantiene su propia lista paginada en el cliente.
- **Preferencia de saldo oculto en cookie** (no `localStorage`): el servidor la lee, así que no hay parpadeo del saldo real al cargar.

### Navegación

- **Pestañas Inicio / Enviar** con `aria-current` según la ruta. En móvil pasan a una **barra inferior** (Inicio · Enviar · Cuenta) al alcance del pulgar.
- **Cerrar sesión dentro del menú de cuenta** (con nombre, correo o teléfono y "Ocultar saldo") para evitar clics accidentales. El menú se cierra con Escape o con un clic afuera, y el foco va al primer elemento al abrirlo.
- **"Ocultar saldo" compartido** entre el menú y el hero con `useSyncExternalStore` sobre la cookie: un solo origen de verdad, sin un Context global, y sin parpadeo porque el servidor lee la misma cookie.

## 4. Estado

**Sin librería global.** Uso `useReducer` dentro del flujo de transferencia, `useState` local en formularios, y los datos del servidor viven en el servidor (RSC + `router.refresh()`).

- El único estado complejo es el del flujo de transferencia, y está **acotado a esa pantalla**. Un store global (Redux o Zustand) lo haría accesible desde cualquier lado sin necesitarlo.
- El "server state" (saldo, movimientos) lo resuelve el modelo RSC. Si la app creciera con mucho data fetching en el cliente (paginación infinita, polling), agregaría TanStack Query antes que un store global.
- Un reducer puro se puede testear sin renderizar nada (`transfer-machine.test.ts`).

## 5. Sesión

- `POST /api/auth/login` crea un **token opaco** y lo guarda en una cookie `httpOnly`, `sameSite=lax` (y `secure` en producción). No uso `localStorage` porque JS no puede leer la cookie (mitiga XSS) y porque el servidor la recibe, lo que permite SSR autenticado.
- `proxy.ts` (el antiguo `middleware`) hace solo un **chequeo optimista** (¿existe la cookie?) para redirigir rápido. La **autorización real** está en la capa de acceso a datos (`requireUserId` en Server Components y `withAuth` en Route Handlers), porque la cookie puede existir y aun así ser inválida.
- El proxy no redirige `/login` → `/home`. Eso lo hace la página de login después de **validar** la sesión. Así se evita un loop infinito cuando la cookie existe pero el servidor ya no la reconoce.

## 6. Dinero

- **Siempre en centavos enteros** (`Cents` es un `number` "branded"), para evitar errores de punto flotante (`19.99 * 100 = 1998.999…`). `parseAmount` convierte el texto del usuario a centavos manipulando strings, sin multiplicar floats.
- El API recibe y devuelve centavos. Solo la UI formatea a MXN con `Intl.NumberFormat("es-MX")`.

## 7. Edge cases considerados

- Monto vacío, `0`, negativo, no numérico, con más de 2 decimales, con `$` y separadores de miles.
- Monto **igual** al saldo (permitido) y monto mayor al saldo.
- Destinatario no seleccionado, destinatario inexistente en el servidor y contacto duplicado al guardar.
- **Doble envío:** el reducer ignora `SUBMITTED` si ya hay uno en curso y el botón se deshabilita.
- **Reintentos seguros:** cada confirmación genera un `Idempotency-Key` y el reintento reutiliza la misma key. Si el primer intento sí se procesó, el servidor devuelve el comprobante original (`200`) sin volver a cobrar.
- **Timeout del cliente** (8 s con `AbortSignal.timeout`) separado del timeout del servidor. A los 3 s aparece un aviso de "está tardando".
- **Fondos insuficientes desde el servidor** aunque el cliente lo haya validado (el saldo pudo cambiar en otra sesión). No se puede reintentar; se ofrece cambiar el monto.
- **Sesión expirada a mitad del flujo:** un `401` se traduce a "Tu sesión expiró" con un link al login.
- Respuestas con forma inesperada: el cliente valida los responses con Zod, y si falla cae al fallback genérico.
- Si el usuario sale de la pantalla mientras hay un request en vuelo, se aborta.
- Con Cache Components, Next mantiene las rutas visitadas montadas pero ocultas (`<Activity>`) y conserva su estado. El login y el flujo de transferencia se resetean en el cleanup de un `useLayoutEffect` al ocultarse, como recomienda la guía de Next. Sin eso, después de cerrar sesión el botón seguía en "Iniciando sesión…" y "Nueva transacción" reabría el comprobante anterior. El flujo además lleva `key={userId}` para que otro usuario no herede su estado local. Los E2E cubren ambos casos.
- Accesibilidad: labels asociados, `aria-invalid` y `aria-describedby`, `role="alert"` en errores, `aria-live` mientras se procesa y radios nativos para elegir contacto.

## 8. Testing

- **Unit (Vitest):** dinero, identificadores, reglas de negocio, reducer, mapeo de errores, servicio de transferencias (idempotencia, reglas en servidor, cada escenario sin mover dinero) y el componente `LoginForm` con Testing Library.
- **E2E (Playwright):** login (validación, error, sesión persistente, logout, ruta protegida), Home (datos, vacío, error y recuperación) y transferencia (validaciones, éxito con comprobante y saldo actualizado, nuevo contacto, y los 5 escenarios de confirmación). Algunos corren también en viewport móvil (`@mobile`).
- **¿Por qué Playwright?** Espera automáticamente a los elementos (menos flakiness), soporta varios navegadores y emulación móvil, permite interceptar la red y genera traces útiles en CI. Los escenarios aleatorios se vuelven deterministas forzándolos con `x-mock-scenario`.

## 9. Qué haría diferente con más tiempo

- Reemplazar el mock en memoria por un repositorio con interfaz (`AccountsRepository`) y un adaptador real. Hoy los servicios usan `getDb()` directamente.
- Idempotencia completa: guardar también el estado "en proceso" y las respuestas de error, con TTL.
- Auth real: OTP por SMS/email, sesión firmada o encriptada (iron-session/JWT), rotación y CSRF token para mutaciones.
- Observabilidad: logging estructurado con correlation id (el idempotency key sirve), métricas por escenario de error y Sentry.
- Paginación con cursor en movimientos y detalle de cada movimiento.
- Rate limiting en login y transferencias.
- Internacionalización y soporte de varias monedas.
- Tests visuales y de accesibilidad automatizados (axe en Playwright).
