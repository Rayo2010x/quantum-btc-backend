# Entropy Worker Load Test Strategy

> **ID:** QM_Load_Test_Plan
> **Version:** 1.1
> **Last Updated:** 2026-04-08
> **Status:** DRAFT

## 1. Introduction & Objectives
The QuantumBTC Roulette operates under a non-custodial Commit-Reveal architecture. The system requires pre-fetched quantum entropy (from the ANU QRNG API) stored locally in the `entropy_buffer` table to guarantee instant resolution upon Lightning Network webhook confirmations.

**Objective:** This document defines the load testing strategy to ensure the `entropy_worker.ts` can replenish the PostgreSQL buffer fast enough to withstand high-concurrency bursts of incoming bets, without causing race conditions or deadlocks.

## 2. Testing Constraints and Parameters
1. **Target Concurrency:** Simulate 50 simultaneous bet resolutions within a 2-second window.
2. **Buffer Capacity:** Observe the worker's behavior maintaining the `BUFFER_TARGET_SIZE` (currently 20).
3. **External Limits:** Check if aggressive polling triggers HTTP 429 (Too Many Requests) or 403 blocks from the ANU API.
4. **Database Locking:** Ensure no `Deadlock found` exceptions occur when multiple concurrent webhook transactions execute SQL `UPDATE entropy_buffer ... FOR UPDATE` requests.

## 3. Test Script Architecture (`scripts/entropy_load_test.ts`)
We will build a local simulation script that bypasses OpenNode temporarily and directly attacks the database resolution flow.
**Why skip OpenNode initially?** OpenNode implements strict *Rate Limiting* on its public API and sandbox. If we try to create and pay 50 invoices in 2 seconds, OpenNode will permanently block our IP or reject the HTTP requests, preventing the test from reaching our true target: the local *Entropy Worker*.

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
* **Phase 3 [COMPLETED]:** Execute the test locally, analyze logs (`ws_debug.log` and console) for performance metrics.
  * *Round 1 (Failed):* 47/50 successes. **Critical Finding:** 3 transactions failed due to `timeout exceeded when trying to connect` (PG Pool Exhaustion). It was identified that the HTTP call to drand (`fetchDrandLatest`) occurred **inside** the database transaction `withTx`. This blocked pool connections for up to 1.5s per bet, suffocating the server.
  * **Applied Optimization:** `fetchDrandLatest` was extracted *outside* the PostgreSQL transactional connection in `src/routes/webhook.ts`, releasing the bottleneck.
  * *Round 2 (Successful):* Executed in 5.8 seconds. **50/50 successful resolutions**. Zero *Deadlocks*, zero PG Pool exhaustions. The public drand *"Rate Limit"* naturally slowed down (~1.5s timeout) some parallel calls, successfully forcing the Fallback Seed rotation silently for the user.
  * **Entropy Worker Response:** The worker successfully replenished the seeds from the ANU API asynchronously without triggering an HTTP 429 ban.
* **Phase 4 (OpenNode Restoration & End-to-End):** After verifying that the local core holds up, we will execute `scripts/auto_simulate.ts` sending 3 real consecutive full bets to the OpenNode API. This will verify that the complete cycle (Frontend -> OpenNode -> Webhook -> Drand -> Entropy Buffer) works in harmony without degradation.
