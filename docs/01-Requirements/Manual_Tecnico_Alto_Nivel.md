# Manual Técnico de Alto Nivel: Proyecto QuantumBTC

---
**Versión:** 2.17
**Estado:** Vigente
**Última Modificación:** 2026-04-08
**Cambios:** v2.17 — Corrección de Sección 10: §10.2 refleja la decisión real (script SSR personalizado, no `vite-plugin-prerender`); §10.3 corrige el mecanismo técnico (react-dom/server + renderToString, no Puppeteer/JSDOM); §10.5 actualiza la tabla de archivos con paths y nombres reales.
---

## 1. Resumen de Operación
Quantum Fair es una plataforma de juego que opera íntegramente sobre Lightning Network con unidades en satoshis.

* **Sin Cuentas (Non-custodial operativo):** No se gestionan balances de usuario; cada ronda es una transacción independiente.
* **Flujo de Entrada:** El usuario paga una factura BOLT11 generada por el backend.
* **Flujo de Salida:** Los premios se reclaman mediante un código QR de tipo LNURL-withdraw.
* **Unidad Nativa:** Toda la lógica se calcula en satoshis para evitar la volatilidad del precio del BTC.

## 2. Gestión de Riesgo y Control de Bankroll
El sistema ha sido diseñado para ser elástico, permitiendo que la plataforma crezca orgánicamente con su liquidez.

### 2.1 Definiciones de Capital
* **Bankroll Inicial:** 500,000 Satoshis.
* **Piso de Seguridad (Floor):** 80% del bankroll (400,000 Sats en el arranque).
* **Balance Disponible (balance_sat):** Saldo real en el proveedor (OpenNode).
* **Reserva de Premios (reserved_sat):** Suma de todos los premios ganados cuyos tokens LNURL-withdraw aún no han sido cobrados o expirado.

### 2.2 Límite de Apuesta Elástico (MaxBet)
A diferencia de un límite fijo, el sistema calcula la apuesta máxima permitida en tiempo real según la liquidez actual:

$$MaxBet = \frac{balance\_sat - reserved\_sat}{M \cdot K}$$

Donde $M$ es el multiplicador de la apuesta y $K$ es un factor de seguridad (recomendado: 2 a 5).

### 2.3 Regla de Admisión de Apuestas
El sistema permitirá apuestas siempre que el balance real sea suficiente para cubrir el premio potencial:

$$balance\_sat - reserved\_sat - (bet\_sat \cdot M) - fee\_buffer\_sat > 0$$

Si el balance cae por debajo del 80% (floor_sat), el sistema emitirá alertas automáticas, pero seguirá operando mientras exista liquidez real.

#### Manejo de Estados HTTP y Control de Front-End
Para una integración segura entre la API y el Front-End de Quantum BTC, se aplican los siguientes estados de error durante la admisión de apuestas:

-   **HTTP 400 Bad Request (Límite de Exposición):** Si una apuesta supera el cálculo establecido por el límite elástico (`MaxBet`), usualmente si el pago total rompe el umbral dinámico (aprox > 2% del Bankroll), el servidor rechazará la solicitud indicando `400 Bad Request`. El Frontend debe capturar este error y mostrar una alerta o Toast visual explicando que se superó el límite máximo de pago por jugada.
-   **HTTP 503 Service Unavailable (Alerta Roja):** Si el Bankroll cae a niveles críticos (e.g., `< 20,000 Sats`), el sistema entra en modo de protección de liquidez. El backend responderá con `503 Service Unavailable`. El Frontend debe bloquear todo control de apuestas (Disable) y mostrar un cartel/overlay de "Mantenimiento de Liquidez".

## 3. Mecánica de la Ruleta Europea
Se utiliza el modelo estándar de 37 números (0-36). El cero siempre favorece a la casa en apuestas externas.

El sistema soporta apuestas simples y complejas (Outside Bets, Dozens, Splits) mediante la evaluación de un **Arreglo de Números**.
El API Backend recibe un arreglo de `$N$` números. El multiplicador de premio se calcula matemáticamente de forma dinámica en el backend:

$$Multiplier = \frac{36}{N}$$

**Reglas Críticas de Aceptación:**
1. $N$ (la cantidad de números en la apuesta) debe ser un divisor exacto de 36 para garantizar que no existan premios fraccionarios en Satoshis (`36 % N == 0`).
2. El tamaño máximo del arreglo es 18 (e.g., apostar a 1-18, Rojo/Negro, Par/Impar).

| Tipo de apuesta (Frontend) | Tamaño del Arreglo ($N$) | Multiplicador de Pago ($M$) |
| :--- | :--- | :--- |
| Pleno (1 número) | 1 | 36× |
| Split (2 números) | 2 | 18× |
| Docena / Columna | 12 | 3× |
| Rojo/Negro, Par/Impar | 18 | 2× |

### 3.1 Visualización del Resultado (Animación)
Para mantener la experiencia "Premium", el sistema no debe mostrar el resultado numérico inmediatamente.
1.  **Estado INICIAL:** Ruleta estática o en rotación lenta (idle).
2.  **Estado SPINNING:** Al confirmar el pago (webhook), la ruleta gira visualmente durante 3-5 segundos.
3.  **Estado RESULT:** La ruleta se detiene exactamente en el número calculado por la entropía ($final\_result$).
4.  **Feedback:** Indicadores visuales claros de GANADOR (Lluvia de confeti/brillo) o PERDEDOR (Tono apagado).

**Flujo de Continuidad (UI Requisitos):**
*   **Perdedor:** No debe mostrarse un botón de "Inténtalo de nuevo". El jugador simplemente debe limpiar la mesa o seleccionar nuevas fichas para volver a jugar.
*   **Ganador (Cobro Pendiente):** Se muestra el código QR LNURL-withdraw. No debe mostrarse un botón de "Jugar de nuevo" debajo del QR.
*   **Ganador (Premio Cobrado):** Una vez que el jugador escanea y cobra exitosamente el LNURL (detectado vía polling del estado del token o webhook), el QR debe ocultarse y reemplazarse por el mensaje "Prize transferred. Congrats!".
*   **Prevención de Pérdida de Premio:** Si el jugador intenta pulsar "SPIN" para una nueva jugada mientras existe un premio ganador que **no** ha sido cobrado, el front-end debe interceptar la acción con un diálogo de advertencia explícito para evitar que pierda el QR de cobro de la vista. Emitir el mensaje: *"Warning: You haven't claimed your prize yet! If you continue without claiming, you might lose it. Do you want to continue?"*

## 4. Provably Fair y Entropy Buffer
El motor de azar utiliza un esquema híbrido de Commit-Reveal para garantizar transparencia y eliminar latencia.

### 4.1 El "Entropy Buffer" y Beacon Público (ANU QRNG + drand)
El sistema garantiza entropía justa e impredecible utilizando dos fuentes integradas en tiempo de resolución:

1.  **Recolección Local (ANU QRNG):** Un proceso en segundo plano (worker) almacena bytes de entropía cuántica pre-generada en la base de datos de forma asíncrona para evitar latencia.
2.  **Recolección Pública Síncrona (drand):** En el momento exacto de la confirmación del pago (vía webhook), el sistema realiza un HTTP GET al endpoint `/public/latest` de la API de drand. Esta llamada define el estado temporal ("cuándo" ocurrió la confirmación).
3.  **Almacenamiento y Prueba (Auditoría):** Los datos resultantes de drand (`round`, `randomness` y `signature`) se almacenan inmediatamente en la tabla de apuestas asociados al `bet_id`, garantizando que el usuario pueda verificar computacionalmente la honestidad de la ronda.

### 4.2 Fórmula de Resultado
La entropía final se calcula tras el pago:
$$final\_entropy = SHA256(cached\_anu\_bytes \ || \ client\_seed \ || \ drand\_randomness)$$
El resultado es el $final\_entropy \pmod{37}$.

## 5. Arquitectura Técnica y Flujos
| Componente | Función Principal |
| :--- | :--- |
| **Frontend** | Interfaz de usuario, visualización de QR y verificador público. |
| **Backend API** | Gestión de lógica, cálculo de MaxBet y orquestación de pagos. |
| **Entropy Worker** | Servicio encargado de llenar el Buffer de Entropía (ANU QRNG). |
| **OpenNode** | Pasarela para cobro de facturas y ejecución de retiros salientes. |
| **PostgreSQL** | Persistencia de apuestas, auditoría y tokens de retiro. |

### 5.2 Pestaña de Estadísticas (Statistics Tab)
Para proveer transparencia sobre la recurrencia de los resultados, el sistema cuenta con una pestaña dedicada a métricas agregadas ("Statistics"), accesible permanentemente y ubicada junto a "Roulette".
*   **Métrica Global:** Cantidad total de apuestas jugadas o la cantidad filtrada según elección.
*   **Selector "Last Bets":** Se provee un menú de filtrado interactivo que permite cuantificar únicamente las últimas $N$ jugadas (200, 500, 1000, 5000, All). Esto aisla el "ruido de datos" de jugadas extremadamente antiguas y favorece un análisis probabilístico reciente. Su estado predeterminado es "200". La vista se actualiza de manera exclusiva al acceder por primera vez o al modificar el selector.
*   **Distribución (Histogramas de Doble Eje):** Información histórica agregada (Cantidad Absoluta y Porcentaje) extraída del lote de apuestas correspondientes al filtro aplicado:
    *   Frecuencia de Plenos (Números 0-36).
    *   Frecuencia por Filas (Row 1, Row 2, Row 3).
    *   Frecuencia por Docenas (1st, 2nd, 3rd).
    *   Frecuencia por Mitades (1-18, 19-36).
    *   Frecuencia por Colores (Rojo, Negro).
    *   Frecuencia por Paridad (Par, Impar).
*   **Nota Técnica Frontend:** El cero (0) no contabiliza en las métricas de color, paridad, mitades, docenas ni filas, en estricto apego a las reglas de la ruleta europea. Los gráficos están renderizados de manera altamente optimizada sin dependencias masivas usando CSS puro/Glassmorphism y soportan abreviación automática de cifras (1.2K, 3.5M) para prevenir desbordes tipográficos a medida que aumenta el volumen de apuestas.


## 6. Seguridad e Idempotencia
* **Premios Seguros:** Cada withdraw_token es de un solo uso y se procesa mediante transacciones atómicas.
* **Webhooks:** Se verifica la firma HMAC de OpenNode para confirmar la legitimidad de los pagos.
* **Límites de Abuso:** Rate limiting por IP y por token de retiro para prevenir ataques.

## 7. Compliance y Geo-Blocking (Regulatorio)
Para cumplir con normativas internacionales, el sistema implementa controles de acceso geográfico:
*   **Registro de IP:** Se almacena la dirección IP de origen de cada sesión (`/session/init`) con fines de auditoría.
*   **Restricción Regional:** Se bloquea el acceso a usuarios con direcciones IP provenientes de:
    *   EE.UU., Reino Unido (GB) y Unión Europea (UE).
*   **Mecanismo:** Validación vía middleware en el backend. Se prioriza el uso de cabeceras de red perimetral (Edge Network Headers como `CF-IPCountry`) proporcionadas por proveedores como Cloudflare para una máxima precisión geográfica frente a redes Anycast/VPN. Como respaldo o para entornos locales, se utiliza una base de datos local de GeoIP (`geoip-lite`). El bloqueo retorna un error `403 Forbidden`.
    *   **Excepción de Transparencia:** El endpoint `/v1/game/statistics` está explícitamente excluido del bloqueo. Esto garantiza que cualquier usuario, independientemente de su jurisdicción, pueda auditar las métricas históricas de la plataforma.
*   **Auditoría de Bloqueos:** 
    *   Todo intento de acceso bloqueado es registrado permanentemente en la tabla `geo_block_logs` (IP, país y timestamp).
    *   **Trazabilidad Adicional:** La tabla `sessions` almacena tanto la `ip_address` como el `country` de origen para todas las conexiones permitidas, permitiendo auditorías de cumplimiento posteriores.

## 8. Campaña "Quantum Genesis" (Recompensas Post-Quánticas)
Como iniciativa de fomento a la investigación, los usuarios pueden registrar su sesión para calificar a potenciales recompensas futuras.

*   **Identidad:** Se vincula el `sessionId` efímero con una dirección BTC o Lightning Address.
*   **Ranking de Aportación:** Se calcula la contribución total agregada **por dirección**. Es decir, la suma del volumen (`sum(amount_sat)`) de todas las sesiones registradas bajo una misma dirección BTC/LN.
*   **Prompt Proactivo:** El sistema verifica el estado de registro de la sesión al inicio y sugiere la asociación si se encuentra vacía, facilitando la continuidad del usuario y la acumulación de puntos.
*   **Transparencia:** El registro es opcional y no afecta la probabilidad de acierto de la ruleta, la cual sigue regida estrictamente por las reglas de entropía cuántica del Capítulo 4.

## 9. Módulo de Donaciones
El sistema permite a cualquier usuario (incluyendo IPs geobloqueadas) realizar contribuciones voluntarias para apoyar el desarrollo de Quantum BTC.
*   **Generación de Facturas (In-App):** Se utiliza un modal nativo en el Frontend donde el usuario especifica el monto deseado en satoshis. El backend genera una factura dinámica (`charge_id`) llamando a OpenNode de forma transparente, evitando así las redirecciones a plantillas externas y asegurando una experiencia sin fricción (siempre en la unidad SAT y en el idioma nativo de la app).
*   **Registro Opcional:** El usuario tiene la opción de registrar su dirección BTC L1 o Lightning Address al momento de crear la factura. Este campo es estrictamente opcional y se almacena directamente en la base de datos junto al registro de la donación.
*   **Seguimiento:** El pago de la donación se confirma de manera asíncrona mediante los mismos webhooks (`charge:paid` via OpenNode), cambiando el estado de la donación a completada, lo que se refleja en tiempo real en la UI del donante.

## 10. Arquitectura SEO: Pre-rendering Estático del Frontend

### 10.1 Contexto y Problema
El frontend de QuantumBTC está implementado como una **Single Page Application (SPA)** construida con Vite + React. Si bien esto provee una experiencia de usuario fluida, presenta un problema estructural crítico para el posicionamiento en motores de búsqueda:

Cuando Googlebot (o cualquier crawler) visita `https://quantumbtc.dev/`, el servidor responde con un documento HTML que contiene únicamente `<div id="root"></div>`. El contenido real (hero, propuesta de valor, keywords, headings) reside íntegramente en el bundle de JavaScript del cliente, el cual los crawlers no ejecutan de forma confiable.

**Consecuencia directa (confirmada vía Google Search Console):**
- Google indexó la URL pero sin contenido textual relevante.
- La página no rankea para ningún término de búsqueda, incluyendo la keyword de marca "quantum btc".
- Core Web Vitals reporta "Sin datos" (Google no pudo evaluar el rendering).

### 10.2 Decisión Arquitectónica: Script SSR Personalizado (`react-dom/server`)

Se adopta la estrategia de **Pre-rendering estático post-build** mediante un script personalizado basado en Vite SSR + `react-dom/server`. Esta solución fue seleccionada después de descartar las alternativas existentes:

| Criterio | Script SSR Personalizado ✅ | `vite-plugin-prerender` ❌ | Migrar a Next.js |
| :--- | :--- | :--- | :--- |
| Compatibilidad con Vite 7 | ✅ Total | ❌ Incompatible (usa `require()` CommonJS) | ✅ Nativo |
| Tiempo de implementación | ~2-3 horas | N/A (descartado) | ~8-16 horas |
| Riesgo de regresión | Bajo (no cambia el framework) | — | Alto (reescritura total) |
| Dependencias externas | Ninguna (react-dom ya incluido) | Puppeteer o JSDOM | — |
| Mantenibilidad | Alta (script propio, sin magia) | — | Alta (Next.js es estándar) |
| Resolución del problema SEO | ✅ Completa | — | ✅ Completa |

**Veredicto:** `vite-plugin-prerender` fue descartado por incompatibilidad con el ecosistema ESM de Vite 7 (intenta ejecutar `require()` en un contexto de módulo). La solución de script personalizado resuelve el problema sin añadir dependencias ni cambiar el framework, siendo la opción más pragmática para una landing page estática. Si en el futuro el frontend evoluciona a un portal con autenticación y contenido dinámico por usuario, se reconsiderará la migración a Next.js.

### 10.3 Mecanismo de Pre-rendering

El script `scripts/prerender.mjs` se ejecuta como paso post-build. Utiliza **Vite en modo SSR** para compilar un bundle de servidor a partir de `src/entry-server.tsx`, y luego usa `react-dom/server` para renderizar el árbol de React a una cadena HTML estática en Node.js. **No se utiliza ningún navegador headless (Puppeteer/JSDOM/Playwright)**.

```
npm run build:seo
    ↓
[1] tsc -b && vite build → genera dist/ (bundle del cliente)
    ↓
[2] node scripts/prerender.mjs
    ↓
    ├─ Vite SSR build de src/entry-server.tsx → genera dist-ssr/entry-server.js
    ├─ Parchea globals del navegador (localStorage, window) en Node.js
    ├─ Importa dist-ssr/entry-server.js → llama a render()
    ├─ react-dom/server.renderToString(<App />) → appHtml (string)
    ├─ Inyecta appHtml en dist/index.html reemplazando <div id="root"></div>
    └─ Elimina dist-ssr/ (artefactos temporales SSR)
    ↓
Vercel recibe dist/index.html con HTML real en el body
    ↓
Googlebot lee contenido real → Indexación correcta
```

**Nota de seguridad:** `renderToString()` **no ejecuta `useEffect`**, por lo tanto ninguna llamada al backend de la API ocurre durante el proceso de pre-rendering. El HTML generado corresponde exclusivamente al estado inicial de la UI (la vista WhitePaperView, que es la vista por defecto de la landing).

### 10.4 Rutas a Pre-renderizar (Fase 1)

En la primera fase, solo existe una ruta pública estática que requiere pre-rendering:

| Ruta | Prioridad | Nota |
| :--- | :--- | :--- |
| `/` (Home / Landing) | 🔴 Crítica | Página principal de marketing |

Si en el futuro se agregan rutas estáticas adicionales (`/about`, `/whitepaper`, `/verify`), deberán añadirse a la configuración del plugin y al `sitemap.xml`.

### 10.5 Ficheros Afectados y Correcciones Adicionales

Además del pre-rendering, se listan todos los archivos creados o modificados durante la implementación:

| Archivo | Estado | Descripción |
| :--- | :--- | :--- |
| `src/entry-server.tsx` | **NUEVO** | Entry point SSR. Exporta `render(): string` usando `react-dom/server.renderToString(<App />)`. |
| `scripts/prerender.mjs` | **NUEVO** | Script post-build de 4 pasos: build SSR → patch globals → renderToString → inject HTML. |
| `vercel.json` | MODIFICADO | `buildCommand` cambiado a `npm run build:seo` para ejecutar el pre-rendering en cada deploy. |
| `package.json` | MODIFICADO | Scripts `prerender` (`node scripts/prerender.mjs`) y `build:seo` (`npm run build && npm run prerender`) añadidos. |
| `public/favicon.png` | **NUEVO** | Favicon oficial de QuantumBTC (PNG, logo circular atómico de `07_Brand_Assets`). Reemplaza la referencia incorrecta al `/vite.svg` del framework. |
| `public/og-image.png` | **NUEVO** | Imagen Open Graph oficial (banner panorámico de `07_Brand_Assets`, formato 1200×630px). Resuelve la referencia rota que existía en los meta tags. |
| `index.html` | MODIFICADO | Actualizado: referencia de favicon a `/favicon.png`, `og:image` y `twitter:image` a `/og-image.png`, corrección de naming "Quantum BTC" → "QuantumBTC" en todos los meta tags, y actualización de `meta description` con keyword natural "Quantum BTC". |
| `public/sitemap.xml` | MODIFICADO | `lastmod` actualizado a `2026-04-07`. |

### 10.6 Restricción de Seguridad (No Pre-renderizar)

Las siguientes rutas **NO deben ser pre-renderizadas** ni expuestas a crawlers:
- Cualquier ruta del juego activo (`/game`, `/play`, etc.) — protegida por geo-blocking.
- Endpoints de API (`/v1/*`) — no son rutas de frontend.
- Rutas de administración o internas.

El archivo `robots.txt` debe mantenerse con `Allow: /` para la landing, pero agregar `Disallow` explícito si se crean rutas de juego con paths separados en el futuro.