# API Specification - Quantum BTC

> **Artifact ID:** 20260130_API_Specification_v1.2
> **Version:** 1.2
> **Date:** 2026-02-06
> **Status:** Vigente

## 1. Base URL
`https://api.quantumbtc.io` (Production)
`http://localhost:3000` (Development)

## 2. REST Endpoints

### 2.1 Session Management
**Init Session** (Creates ephemeral ID)
*   **POST** `/v1/session/init`
*   **Response:** `{ "sessionId": "uuid", "message": "Session initialized" }`
*   **Notes:** Implicitly logs client IP address for compliance/geo-blocking.

### 2.2 Game Logic (Pay-Per-Spin)
**Place Bet**
*   **POST** `/v1/game/bet`
*   **Body:**
    ```json
    {
      "sessionId": "uuid",
      "bets": { "0": 100, "17": 50 },
      "clientSeed": "user_provided_entropy"
    }
    ```
*   **Response:**
    ```json
    {
      "betId": "uuid",
      "paymentRequest": "lnbc1...",
      "chargeId": "opennode_id",
      "amountSat": 150,
      "expiration": 600
    }
    ```

**Get Bet Status**
*   **GET** `/v1/game/bet/:betId/status`
*   **Response:**
    ```json
    {
      "status": "WAITING_PAYMENT | PROCESSING | WON | LOST",
      "outcome": 17,
      "payoutSat": 3600,
      "lnurlWithdraw": "lnurl1..." // Only if WON
    }
    ```


## 3. LNURL-Withdraw Specification (LUD-03)

**Step 1: Wallet Scans QR**
*   **GET** `/v1/lnurl/withdraw?k1=...`
*   **Response:**
    ```json
    {
      "tag": "withdrawRequest",
      "callback": "https://api.quantumbtc.io/v1/lnurl/callback",
      "k1": "...",
      "defaultDescription": "Quantum BTC Winnings",
      "minWithdrawable": 1000,
      "maxWithdrawable": 1000000
    }
    ```

**Step 2: Wallet Sends Invoice**
*   **GET** or **POST** `/v1/lnurl/callback?k1=...&pr=lnbc1...`
*   **Response:** `{ "status": "OK" }` or `{ "status": "ERROR", "reason": "..." }`

## 4. Webhooks (OpenNode)

**Charge Paid**
*   **POST** `/v1/webhooks/opennode`
*   **Content-Type:** `application/x-www-form-urlencoded`
*   **Headers:** `x-signature: <HMAC>`
*   **Body:**
    ```json
    {
      "id": "charge_id",
      "status": "paid",
      "hashed_order": "secret_hash"
    }
    ```
