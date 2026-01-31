# Manual Técnico de Alto Nivel: Proyecto Quantum BTC

---
**Versión:** 2.0  
**Estado:** Vigente  
**Última Modificación:** 30 de enero de 2026  
**Cambios:** Migración a formato profesional Markdown; integración de gestión de riesgo elástica y sistema de Entropy Buffer optimizado.
---

## 1. Resumen de Operación (MVP)
[cite_start]Quantum BTC es una plataforma de ruleta europea clásica que opera íntegramente sobre Lightning Network con unidades en satoshis[cite: 178, 179].

* [cite_start]**Sin Cuentas (Non-custodial operativo):** No se gestionan balances de usuario; cada ronda es una transacción independiente[cite: 180].
* [cite_start]**Flujo de Entrada:** El usuario paga una factura BOLT11 generada por el backend[cite: 181].
* [cite_start]**Flujo de Salida:** Los premios se reclaman mediante un código QR de tipo LNURL-withdraw[cite: 182].
* [cite_start]**Unidad Nativa:** Toda la lógica se calcula en satoshis para evitar la volatilidad del precio del BTC[cite: 183].

## 2. Gestión de Riesgo y Control de Bankroll
[cite_start]El sistema ha sido diseñado para ser elástico, permitiendo que la plataforma crezca orgánicamente con su liquidez[cite: 185].

### 2.1 Definiciones de Capital
* [cite_start]**Bankroll Inicial:** 500,000 Satoshis[cite: 187].
* [cite_start]**Piso de Seguridad (Floor):** 80% del bankroll (400,000 Sats en el arranque)[cite: 188].
* [cite_start]**Balance Disponible (balance_sat):** Saldo real en el proveedor (OpenNode)[cite: 189].
* [cite_start]**Reserva de Premios (reserved_sat):** Suma de todos los premios ganados cuyos tokens LNURL-withdraw aún no han sido cobrados o expirado[cite: 190].

### 2.2 Límite de Apuesta Elástico (MaxBet)
[cite_start]A diferencia de un límite fijo, el sistema calcula la apuesta máxima permitida en tiempo real según la liquidez actual[cite: 192]:

$$MaxBet = \frac{balance\_sat - reserved\_sat}{M \cdot K}$$

[cite_start]Donde $M$ es el multiplicador de la apuesta y $K$ es un factor de seguridad (recomendado: 2 a 5)[cite: 193, 195, 196].

### 2.3 Regla de Admisión de Apuestas
[cite_start]El sistema permitirá apuestas siempre que el balance real sea suficiente para cubrir el premio potencial[cite: 198]:

[cite_start]$$balance\_sat - reserved\_sat - (bet\_sat \cdot M) - fee\_buffer\_sat > 0$$ [cite: 199]

[cite_start]Si el balance cae por debajo del 80% (floor_sat), el sistema emitirá alertas automáticas, pero seguirá operando mientras exista liquidez real[cite: 200].

## 3. Mecánica del Juego: Ruleta Europea
Se utiliza el modelo estándar de 37 números (0-36). [cite_start]El cero siempre favorece a la casa en apuestas externas[cite: 201, 202].

| Tipo de apuesta | Payout | Pago Total (M) |
| :--- | :--- | :--- |
| Pleno (1 número) | 35:1 | 36× |
| Split (2 números) | 17:1 | 18× |
| Docena / Columna | 2:1 | 3× |
| Rojo/Negro, Par/Impar | 1:1 | 2× |
[cite_start]
### 3.1 Visualización del Resultado (Animación)
Para mantener la experiencia "Premium", el sistema no debe mostrar el resultado numérico inmediatamente.
1.  **Estado INICIAL:** Ruleta estática o en rotación lenta (idle).
2.  **Estado SPINNING:** Al confirmar el pago (webhook), la ruleta gira visualmente durante 3-5 segundos.
3.  **Estado RESULT:** La ruleta se detiene exactamente en el número calculado por la entropía ($final\_result$).
4.  **Feedback:** Indicadores visuales claros de GANADOR (Lluvia de confeti/brillo) o PERDEDOR (Tono apagado).


## 4. Provably Fair y Entropy Buffer
[cite_start]El motor de azar utiliza un esquema híbrido de Commit-Reveal para garantizar transparencia y eliminar latencia[cite: 204, 205].

### 4.1 El "Entropy Buffer" (ANU QRNG + drand)
1.  [cite_start]**Recolección:** Un proceso en segundo plano almacena bytes de entropía cuántica de ANU Quantum Numbers en la base de datos[cite: 208].
2.  [cite_start]**Consumo:** Al confirmarse una apuesta, el sistema asocia bytes del buffer al bet_id[cite: 209].
3.  [cite_start]**Verificabilidad:** Se combina con un beacon público (drand) para asegurar la integridad[cite: 210].

### 4.2 Fórmula de Resultado
[cite_start]La entropía final se calcula tras el pago[cite: 212]:
[cite_start]$$final\_entropy = SHA256(server\_seed \ || \ client\_seed \ || \ drand\_randomness \ || \ cached\_anu\_bytes \ || \ bet\_id)$$ [cite: 213]
[cite_start]El resultado es el $final\_entropy \pmod{37}$[cite: 214].

## 5. Arquitectura Técnica y Flujos
| Componente | Función Principal |
| :--- | :--- |
| **Frontend** | [cite_start]Interfaz de usuario, visualización de QR y verificador público[cite: 217]. |
| **Backend API** | [cite_start]Gestión de lógica, cálculo de MaxBet y orquestación de pagos[cite: 217]. |
| **Entropy Worker** | [cite_start]Servicio encargado de llenar el Buffer de Entropía (ANU QRNG)[cite: 217]. |
| **OpenNode** | [cite_start]Pasarela para cobro de facturas y ejecución de retiros salientes[cite: 217]. |
| **PostgreSQL** | [cite_start]Persistencia de apuestas, auditoría y tokens de retiro[cite: 217]. |

### 5.1 Ciclo de Vida del Premio (Claim TTL)
* [cite_start]**Validez del QR de Cobro:** Los premios tienen un TTL de 24 horas[cite: 220].
* [cite_start]**Gestión de Reserva:** Durante estas 24 horas, el monto se mantiene en reserved_sat[cite: 221].
* [cite_start]**Expiración:** Si no se cobra, el monto vuelve al balance operativo, manteniendo el registro de la deuda[cite: 222].

## 6. Seguridad e Idempotencia
* [cite_start]**Premios Seguros:** Cada withdraw_token es de un solo uso y se procesa mediante transacciones atómicas[cite: 224].
* [cite_start]**Webhooks:** Se verifica la firma HMAC de OpenNode para confirmar la legitimidad de los pagos[cite: 225].
* [cite_start]**Límites de Abuso:** Rate limiting por IP y por token de retiro para prevenir ataques[cite: 226].