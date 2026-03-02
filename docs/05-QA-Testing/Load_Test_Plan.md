# Entropy Worker Load Test Strategy

---
**Version:** 1.0
**Status:** DRAFT
**Last Modified:** 2026-03-02
---

## 1. Introduction & Objectives
The Quantum BTC Roulette operates under a non-custodial Commit-Reveal architecture. The system requires pre-fetched quantum entropy (from the ANU QRNG API) stored locally in the `entropy_buffer` table to guarantee instant resolution upon Lightning Network webhook confirmations.

**Objective:** This document defines the load testing strategy to ensure the `entropy_worker.ts` can replenish the PostgreSQL buffer fast enough to withstand high-concurrency bursts of incoming bets, without causing race conditions or deadlocks.

## 2. Testing Constraints and Parameters
1. **Target Concurrency:** Simulate 50 simultaneous bet resolutions within a 2-second window.
2. **Buffer Capacity:** Observe the worker's behavior maintaining the `BUFFER_TARGET_SIZE` (currently 20).
3. **External Limits:** Check if aggressive polling triggers HTTP 429 (Too Many Requests) or 403 blocks from the ANU API.
4. **Database Locking:** Ensure no `Deadlock found` exceptions occur when multiple concurrent webhook transactions execute SQL `UPDATE entropy_buffer ... FOR UPDATE` requests.

## 3. Test Script Architecture (`scripts/entropy_load_test.ts`)
We will build a local simulation script that bypasses OpenNode temporarily and directly attacks the database resolution flow.
**¿Por qué saltarse OpenNode inicialmente?** OpenNode implementa *Rate Limiting* estricto en su API pública y sandbox. Si intentamos crear y pagar 50 facturas en 2 segundos, OpenNode nos bloqueará la IP permanentemente o rechazará las peticiones HTTP, impidiendo que la prueba llegue a nuestro verdadero objetivo: el *Entropy Worker* local.

1. **Setup:** Inject 50 dummy "WAITING_PAYMENT" bets into the `bets` table.
2. **Execution:** Spawn 50 concurrent `Promise.all` workers to simulate the exact webhook DB transaction (fetching entropy from the buffer and linking to the bet).
3. **Worker Race:** The `entropy_worker` will be running in parallel. As the test consumes entropy, the worker must wake up rapidly and refill it.
4. **Assertion:** 
   * Ensure 100% of the 50 bets received a unique `entropy_id`.
   * Ensure total execution time is under 15 seconds.
   * Verify ANU API stability.

## 4. Execution Plan
* **Phase 1 [COMPLETED]:** Approve this strategy document.
* **Phase 2 [COMPLETED]:** Implement `scripts/entropy_load_test.ts` (Database Core Stress Test).
* **Phase 3 [COMPLETED]:** Execute the test locally, analyze logs (`ws_debug.log` y consola) para métricas de rendimiento.
  * *Ronda 1 (Fallida):* 47/50 éxitos. **Hallazgo Crítico:** 3 transacciones fallaron por `timeout exceeded when trying to connect` (PG Pool Exhaustion). Se identificó que la llamada HTTP a drand (`fetchDrandLatest`) ocurría **dentro** de la transacción de la base de datos `withTx`. Esto bloqueaba las conexiones del pool por hasta 1.5s por apuesta, asfixiando el servidor.
  * **Optimización Aplicada:** Se extrajo `fetchDrandLatest` *fuera* de la conexión transaccional de PostgreSQL en `src/routes/webhook.ts`, liberando el estrangulamiento.
  * *Ronda 2 (Exitosa):* Ejecutado en 5.8 segundos. **50/50 resoluciones exitosas**. Cero *Deadlocks*, cero agotamientos del PG Pool. El *"Rate Limit"* público de drand ralentizó (~1.5s timeout) de forma natural algunas de las llamadas paralelas, forzando la rotación de Semilla de Respaldo exitosamente y de forma silenciosa para el usuario.
  * **Respuesta del Entropy Worker:** El worker repuso exitosamente las semillas desde la API de ANU de forma asíncrona sin disparar un ban HTTP 429.
* **Phase 4 (Restauración OpenNode & End-to-End):** Tras comprobar que el core local resiste, ejecutaremos `scripts/auto_simulate.ts` enviando 3 apuestas completas consecutivas reales hacia la API de OpenNode. Esto verificará que el ciclo completo (Frontend -> OpenNode -> Webhook -> Drand -> Entropy Buffer) funciona en armonía sin degradación.
