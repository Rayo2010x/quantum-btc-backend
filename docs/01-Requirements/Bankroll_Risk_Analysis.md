# Bankroll Risk & Maximum Bet Strategy

---
**Version:** 1.0
**Status:** DRAFT
**Last Modified:** 2026-03-02
---

## 1. El Problema del "Risk of Ruin" (RoR)
Actualmente en el sistema local, la constante `MAX_BET_SATS` está burdamente definida como `BANKROLL_FLOOR_SATS / 50` (el **2%** del Bankroll). 
Para una ruleta (apuestas *pleno* / *straight* donde se paga 36 veces la apuesta), esto representa un riesgo matemático de quiebra inminente:
- **Bankroll actual:** 400,000 Sats
- **Apuesta actual máxima permitida:** 8,000 Sats (2%)
- **Si el jugador gana:** Gana 8,000 * 35 = **280,000 Sats.**
  
> [!CAUTION]
> ¡Esto significa que el Casino (nosotros) perdería el **70% de su liquidez total** en una sola jugada afortunada del usuario! Dos usuarios ganando simultáneamente quebrarían la mesa irremediablemente y la plataforma no podría honrar el retiro de LNURL, destruyendo su reputación y la confianza del modelo Provably Fair.

## 2. Análisis Estadístico (El Criterio de Kelly Casino)

Para mitigar el riesgo de quiebra (Risk of Ruin) a valores estadísticamente irrelevantes (< 1%), los casinos modernos aplican fórmulas derivadas de la Varianza y la Esperanza Matemática.

* **Probabilidad de perder la casa (Jugador gana):** $p_w = 1 / 37 \approx 2.7\%$
* **Probabilidad de ganar la casa (Jugador pierde):** $p_l = 36 / 37 \approx 97.29\%$
* **House Edge (Ventaja Casa):** $E = 2.70\%$

Usando una derivación del **Criterio de Kelly para Casinos**, la exposición máxima (Payout Máximo) por una apuesta de alta volatilidad (Pleno/36x) no debe jamás exceder entre el **1% y el 3%** del Bankroll Total Disponible, dependiendo de la tolerancia al riesgo corporativo.

## 3. Estrategia Propuesta: "Dynamic Maximum Payout Limits"
En lugar de limitar *la apuesta* de forma plana, debemos limitar el **riesgo de exposición (Maximum Payout)**. De esa forma protegemos la liquidez, ya sea para un *Pleno (36x)* o para *Rojo/Negro (2x)* en un futuro.

### 3.1 Fórmula Core
Para fines del MVP, fijaremos una tolerancia estricta: ninguna apuesta individual debe ser capaz de drenar más del **2% del Bankroll**.

1. **Max Payout Permitido:** `Bankroll * 0.02`
   - Ejemplo local (400k): `400,000 * 0.02 = 8,000 Sats líquidos`
2. **Limitador de Apuesta (Max Bet):** `Max Payout Permitido / Multiplicador de la Apuesta`
   - Ejemplo (Pleno 36x): `8,000 / 35 = 228 Sats` de apuesta máxima.

> [!TIP]
> Si en el futuro integramos apuestas *Rojo/Negro* (multiplicador 2x), esa misma fórmula permitiría al jugador apostar hasta 8,000 Sats de golpe, dado que el impacto negativo a nuestra caja seguiría estando ceñido al 2% de limitación matemática.

## 4. Monitorización de Liquidez y Alertas de Quiebra (OpenNode)

Para que el límite cruzado al 2% sea efectivo matemáticamente, la variable `Bankroll` no puede ser estática. Debe reflejar la liquidez viva disponible en la cuenta de OpenNode.

### 4.1 Frecuencia de Verificación (Polling V/s Webhooks)
* **Webhook Basado en Retiros:** Cada vez que el servidor procesa y autoriza el pago de una factura de retiro (`withdrawal_token`), sabemos con certeza absoluta que nuestra liquidez ha disminuido (o incrementado en el caso de los depósitos). Por lo tanto, actualizaremos la variable global (o en caché Redis/Postgres) inmediatamente en ese flujo.
* **Polling de Sincronización (Frecuencia Sugerida):** Como precaución contra desbalances (tarifas de on-chain de OpenNode extra, comisiones sorpresivas), propongo implementar un `setInterval` asíncrono que consulte el endpoint `GET /v1/account` de OpenNode cada **10 Minutos**. 
  * *Racionalidad:* 10 minutos es el ritmo promedio de un bloque de Bitcoin y es suficientemente espaciado para que el límite de API (rate limits) de OpenNode no nos bloquee.

### 4.2 Alertas Críticas al Administrador
Se propone implementar un sistema de Notificación de Emergencia a través de **NodeMailer (SMTP) o un Webhook a Discord/Telegram** dedicado exclusivamente al Administrador General.

**Triggers de Alertas:**
1. **Yellow Alert (Warning Bankroll Bajo):** Cuando el balance de la cuenta de OpenNode cae a cifras bajo 50% del balance objetivo inicial o `< 100,000 Sats`.
2. **Red Alert (Paro Operativo):** Si la liquidez cae por debajo de `20,000 Sats` (o lo insuficiente para pagar una apuesta base de $1 USD a pleno), el backend transicionará a estado "Under Maintenance", emitiendo la alerta crítica y rebotando apuestas entrantes automáticas para apaciguar el motor de juego.

## 5. Plan de Implementación (Backlog Añadido)
1. Aprobar esta estrategia expandida.
2. Refactorizar el cálculo inicializado en `src/routes/bet.ts` para interceptar las apuestas entrantes basadas en el balance dinámico cacheado.
3. Crear `src/services/bankroll_worker.ts` que inicie el polling de 10 minutos a OpenNode y configure los canales de alerta (Email/Telegram).
4. Proceder a modificar los controles Frontend para que rehusen apuestas inválidas antes de enviar el HTTP Post.
