# Test Strategy - Quantum BTC

> **Artifact ID:** 20260130_Test_Strategy_v1.0
> **Version:** 1.0
> **Date:** 2026-01-30
> **Status:** Draft

## 1. Testing Philosophy
"Trust but Verify". Given the financial nature of the application, testing priorities are:
1.  **Integrity:** Money cannot be created out of thin air.
2.  **Fairness:** The game verification must match the server outcome.
3.  **Concurrency:** Multiple bets/deposits simultaneously must not corrupt the ledger.

## 2. Smoke Tests (Manual Verification)
Before automated suites, we perform "Smoke Tests" to verify core components via scripts.

### 2.1 Database Connectivity
*   **Script:** `scripts/smoke-test-db.ts`
*   **Goal:** Verify connection, SSL config, and Read/Write permissions.

### 2.2 Full Game Loop Simulation (Auditability Check)
*   **Script:** `scripts/smoke-test-game-loop.ts`
*   **Goal:** Simulate the lifecycle of a bet to demonstrate the "Provably Fair" audit trail.
*   **Steps:**
    1.  **Setup:** Create Session & Mock Entropy.
    2.  **Wager:** Deduct Balance, Create Pending Bet (Committing Server Seed Hash).
    3.  **Resolution:** Reveal Server Seed, consume Entropy, calculate Outcome.
    4.  **Settlement:** Update Balance (if Win).
    5.  **Audit:** Verify that `HMAC(server_seed, client_seed)` matches the committed hash.

## 3. Test Coverage Plan

### 2.1 Unit Tests (Jest)
*   **Betting Logic:** Verify `calculateOutcome(serverSeed, clientSeed, ...)` returns deterministic results.
*   **Validation:** Ensure negative bets, non-sat inputs, and invalid numbers are rejected.
*   **HMAC Check:** Test signature verification with valid/invalid keys.

### 2.2 Integration Tests
*   **Payment Flow:** Use `nock` or a Mock Service to simulate OpenNode callbacks.
    *   Test: Deposit -> Webhook -> Balance update.
*   **Game Loop:** Full cycle simulation.
    *   Test: Deposit -> Bet -> Result -> Withdraw Token creation.

### 2.3 Provably Fair Verification Logic
A standalone script `scripts/verify-fairness.ts` MUST be maintained to allow external auditing.
*   **Input:** Client Seed, Server Seed, Nonce.
*   **Output:** Generated Number.
*   **Assertion:** Must match database record.

## 3. Security & Stress Testing
*   **Race Conditions:** Run 50 parallel bets from the same session ID with balance for only 1. 
    *   *Expected Result:* 1 succeeds, 49 fail with "Insufficient Funds".
*   **SQL Injection:** Use `pg` parameterized queries strictly.
