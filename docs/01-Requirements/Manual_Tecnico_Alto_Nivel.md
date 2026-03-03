# Manual Técnico de Alto Nivel: Proyecto Quantum BTC

---
**Versión:** 2.6
**Estado:** Vigente
**Última Modificación:** 2026-03-03
**Cambios:** Refactorización del esquema de apuestas para soportar Apuestas Múltiples/Externas nativas mediante arreglos de números (`numbers[]`).
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


## 4. Provably Fair y Entropy Buffer
El motor de azar utiliza un esquema híbrido de Commit-Reveal para garantizar transparencia y eliminar latencia.

### 4.1 El "Entropy Buffer" y Beacon Público (ANU QRNG + drand)
El sistema garantiza entropía justa e impredecible utilizando dos fuentes integradas en tiempo de resolución:

1.  **Recolección Local (ANU QRNG):** Un proceso en segundo plano (worker) almacena bytes de entropía cuántica pre-generada en la base de datos de forma asíncrona para evitar latencia.
2.  **Recolección Pública Síncrona (drand):** En el momento exacto de la confirmación del pago (vía webhook), el sistema realiza un HTTP GET al endpoint `/public/latest` de la API de drand. Esta llamada define el estado temporal ("cuándo" ocurrió la confirmación).
3.  **Almacenamiento y Prueba (Auditoría):** Los datos resultantes de drand (`round`, `randomness` y `signature`) se almacenan inmediatamente en la tabla de apuestas asociados al `bet_id`, garantizando que el usuario pueda verificar computacionalmente la honestidad de la ronda.

### 4.2 Fórmula de Resultado
La entropía final se calcula tras el pago:
$$final\_entropy = SHA256(server\_seed \ || \ client\_seed \ || \ drand\_randomness \ || \ cached\_anu\_bytes \ || \ bet\_id)$$
El resultado es el $final\_entropy \pmod{37}$.

## 5. Arquitectura Técnica y Flujos
| Componente | Función Principal |
| :--- | :--- |
| **Frontend** | Interfaz de usuario, visualización de QR y verificador público. |
| **Backend API** | Gestión de lógica, cálculo de MaxBet y orquestación de pagos. |
| **Entropy Worker** | Servicio encargado de llenar el Buffer de Entropía (ANU QRNG). |
| **OpenNode** | Pasarela para cobro de facturas y ejecución de retiros salientes. |
| **PostgreSQL** | Persistencia de apuestas, auditoría y tokens de retiro. |

### 5.1 Ciclo de Vida del Premio (Claim TTL)
* **Validez del QR de Cobro:** Los premios tienen un TTL de 24 horas.
* **Gestión de Reserva:** Durante estas 24 horas, el monto se mantiene en reserved_sat.
* **Expiración:** Si no se cobra, el monto vuelve al balance operativo, manteniendo el registro de la deuda.

## 6. Seguridad e Idempotencia
* **Premios Seguros:** Cada withdraw_token es de un solo uso y se procesa mediante transacciones atómicas.
* **Webhooks:** Se verifica la firma HMAC de OpenNode para confirmar la legitimidad de los pagos.
* **Límites de Abuso:** Rate limiting por IP y por token de retiro para prevenir ataques.

## 7. Compliance y Geo-Blocking (Regulatorio)
Para cumplir con normativas internacionales, el sistema implementa controles de acceso geográfico:
*   **Registro de IP:** Se almacena la dirección IP de origen de cada sesión (`/session/init`) con fines de auditoría.
*   **Restricción Regional:** Se bloquea el acceso a usuarios con direcciones IP provenientes de:
    *   Estados Unidos (EE.UU.)
    *   Unión Europea (UE)
*   **Mecanismo:** Validación vía middleware en el backend. Se prioriza el uso de cabeceras de red perimetral (Edge Network Headers como `CF-IPCountry`) proporcionadas por proveedores como Cloudflare para una máxima precisión geográfica frente a redes Anycast/VPN. Como respaldo o para entornos locales, se utiliza una base de datos local de GeoIP (`geoip-lite`). El bloqueo retorna un error `403 Forbidden`.
*   **Auditoría de Bloqueos:** Todo intento de acceso bloqueado es registrado permanentemente en la tabla `geo_block_logs` (IP, país y timestamp) para mantener la consistencia de auditoría y análisis de seguridad.