# Manual Técnico de Alto Nivel: Proyecto Quantum BTC

---
**Versión:** 2.13
**Estado:** Vigente
**Última Modificación:** 2026-03-13
**Cambios:** Inclusión de Reino Unido (GB) en Geo-Bloqueo y registro de país en tabla de sesiones.
---

## 1. Resumen de Operación (MVP)
Quantum BTC es una plataforma de ruleta europea clásica que opera íntegramente sobre Lightning Network con unidades en satoshis.

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

## 3. Mecánica del Juego: Ruleta Europea
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
*   **Auditoría de Bloqueos:** 
    *   Todo intento de acceso bloqueado es registrado permanentemente en la tabla `geo_block_logs` (IP, país y timestamp).
    *   **Trazabilidad Adicional:** La tabla `sessions` almacena tanto la `ip_address` como el `country` de origen para todas las conexiones permitidas, permitiendo auditorías de cumplimiento posteriores.

## 8. Campaña "Quantum Genesis" (Recompensas Post-Quánticas)
Como iniciativa de fomento a la investigación, los usuarios pueden registrar su sesión para calificar a potenciales recompensas futuras.

*   **Identidad:** Se vincula el `sessionId` efímero con una dirección BTC o Lightning Address.
*   **Ranking de Aportación:** Se calcula la contribución total agregada **por dirección**. Es decir, la suma del volumen (`sum(amount_sat)`) de todas las sesiones registradas bajo una misma dirección BTC/LN.
*   **Prompt Proactivo:** El sistema verifica el estado de registro de la sesión al inicio y sugiere la asociación si se encuentra vacía, facilitando la continuidad del usuario y la acumulación de puntos.
*   **Transparencia:** El registro es opcional y no afecta la probabilidad de acierto de la ruleta, la cual sigue regida estrictamente por las reglas de entropía cuántica del Capítulo 4.