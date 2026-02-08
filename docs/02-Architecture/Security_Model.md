# Security Model - Quantum BTC

> **Artifact ID:** 20260130_Security_Model_v1.0
> **Version:** 1.0
> **Date:** 2026-01-30
> **Status:** Draft

## 1. API Security & Authentication

### 1.1 Public vs Private Scope
*   **Public Endpoints:** Game state, public outcomes, provably fair verification.
*   **Protected Endpoints:** Deposits, withdrawals, bet placement. Since this is a "No-Account" casino, "Authentication" is session-based or derived from the payment context.
    *   *Implementation Note:* We will use minimal session tokens or rely on signed payloads for sensitive actions if full auth is not present.

### 1.2 Rate Limiting
To prevent abuse and DoS attacks:
*   **Global Limit:** 100 requests/minute per IP.
*   **Action Limit:** 1 withdrawal request per 10 seconds per IP.
*   **Betting Limit:** Max 1 bet per 500ms to allow for outcome verification and preventing race conditions on the balance.

### 1.3 Geo-Blocking & Compliance
To comply with international regulations, the API enforces strict geographic access controls:
*   **Blocked Regions:** United States (US), European Union (EU).
*   **Mechanism:** Middleware checks `CF-Connecting-IP` (or `X-Forwarded-For`) against a local GeoIP database (`fast-geoip`).
*   **Action:** Requests from blocked regions return `403 Forbidden`.
*   **Audit Logic:** Client IP is logged at session initialization (`POST /session/init`) in the `sessions` table.

### 1.4 LNURL Security (LUD-03/17)
Specific controls for the withdraw flow:
*   **Amount Validation:** The `pr` (invoice) amount in the callback MUST NOT exceed `maxWithdrawable`.
*   **Token Expiration:** The `k1` token has a strict TTL (e.g., 24h). Expired tokens are rejected.
*   **One-Time Use:** A `k1` token is invalidated immediately after a successful withdrawal request.

## 2. Webhook Security (OpenNode)

All incoming webhooks from OpenNode MUST be verified using HMAC-SHA256.

*   **Secret Key:** `OPENNODE_HASHED_SECRET` (Stored in `.env`).
*   **Verification Process:**
    1.  Extract `hashed_order` from the request body.
    2.  Compute `HMAC_SHA256(hashed_order, OPENNODE_HASHED_SECRET)`.
    3.  Compare with `signature` header.
    4.  **REJECT** any request where signature mismatch occurs.

## 3. Environment & Secrets Management
Sensitive keys are strictly loaded from `.env` and typed-checked by Zod on startup.

| Variable | Description | Security Level |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection string for PostgreSQL | **CRITICAL** |
| `OPENNODE_API_KEY` | Read/Write access to funds | **CRITICAL** |
| `ANU_API_KEY` | Access to Quantum RNG | LOW |
| `SESSION_SECRET` | Cookie encryption key | HIGH |

> **Audit Rule:** No sensitive defaults are allowed in the code. The app must crash if these variables are missing.
