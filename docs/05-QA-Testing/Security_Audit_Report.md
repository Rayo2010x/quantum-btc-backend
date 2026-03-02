# Security Audit Report

---
**Version:** 1.0
**Status:** DRAFT
**Last Modified:** 2026-03-02
---

## 1. Scope & Objectives
This document audits the Quantum BTC Backend focusing on critical security domains per the **Global Security Directive**.
The audit scope includes:
1. **Dependency Vulnerability Analysis:** Scanning `package.json` and `package-lock.json` for known CVEs.
2. **Secrets Management:** Verifying the isolation of environment variables (`.env`) and preventing accidental credential leakage.
3. **Access Control & Rate Limiting:** Assessing robustness against abuse (e.g., volumetric/replay attacks, DDoS attempts on the OpenNode webhook).
4. **Injection & Data Sanity:** Validating `Zod` schemas and SQL queries to ensure total prevention of SQLi and malformed input vectors.

## 2. Audit Execution & Findings

### 2.1 Dependencies
* **Status:** Inspected
* **Methodology:** `npm audit` and manual review of core networking packages.
* **Findings:** `npm audit` returned 17 vulnerabilities (9 high, 3 moderate). Critical findings include DoS vulnerabilities in `fastify` (parsing streams/headers), `axios`, and legacy Regex issues in routing parsers (`path-to-regexp`, `body-parser`). The `lnurl` dependency tree also contains out-of-date cryptographic primitives (`elliptic`).
* **Action Required:** Execute `npm audit fix` and selectively update `fastify` to version >5.7.2. Evaluate updating or locking `lnurl` to mitigate transitive vulnerabilities.

### 2.2 Secrets & Environment
* **Status:** Inspected
* **Methodology:** Code evaluation of `src/config/env.ts` and general service injections.
* **Findings:** Environment variables are strictly parsed and typed through `Zod`. Secrets (`SESSION_SECRET`, `OPENNODE_HASHED_SECRET`) enforce minimum character lengths preventing weak local defaults from hitting production. No hardcoded secrets were found in the codebase.
* **Action Required:** None required. Secure by design.

### 2.3 Webhook Resilience & Rate Limiting
* **Status:** Inspected
* **Methodology:** Reviewing `src/routes/webhook.ts`, `src/routes/bet.ts`, and `src/server.ts` for idempotency controls, HMAC signature validation speed, and request limiting.
* **Findings:** 
    * **Webhooks:** The `opennode` webhook verifies the HMAC efficiently and implements database-level idempotency (`SELECT FOR UPDATE` & status checks).
    * **Rate Limiting (CRITICAL RISK):** The application completely lacks rate-limiting middleware globally. Endpoint paths like `/v1/session/init`, `/v1/game/bet` and LNURL endpoints are open to volumetric API abuse and DoS memory exhaustion.
* **Action Required:** Install and configure `@fastify/rate-limit` application-wide, with specific tighter constraints on `/v1/game/bet` and `/v1/webhooks`.

### 2.4 SQL & Data Integrity
* **Status:** Inspected
* **Methodology:** Reviewing `src/db/index.ts` and all route handlers for strict parameterized queries.
* **Findings:** All database interactions utilize `pg.query()` with parameterized string arrays (`$1, $2`). Request bodies are strongly validated via `Zod` (e.g. `PlaceBetSchema`) rejecting malformed or out-of-bounds parameters before reaching the database logic.
* **Action Required:** None required. Secure by design.

## 3. Recommended Remediation Plan

Based on the findings, the following actions have been executed to secure the backend before production:

1. **Dependency Patching [COMPLETED]:** Ran `npm audit fix` to isolate and upgrade vulnerable packages (`fastify`, `axios`) resolving the remote DoS vectors. 13 out of 17 vulnerabilities were aggressively patched without breaking changes.
2. **Implement Rate Limiting [COMPLETED]:** Introduced `@fastify/rate-limit` to the main server execution context.
   * `Global`: 100 requests per minute per IP.
   * `/v1/game/bet` & Payment webhooks: Strict sub-limits (10-20 req/min) to prevent invoice spamming and validation exhaustion.
