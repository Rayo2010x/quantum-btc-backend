# API Specification - Quantum BTC

> **Artifact ID:** 20260130_API_Specification_v1.0
> **Version:** 1.0
> **Date:** 2026-01-30
> **Status:** Draft

## 1. Base URL
`https://api.quantumbtc.io` (Production)
`http://localhost:3000` (Development)

## 2. REST Endpoints

### 2.1 Session Management
**Init Session** (Optional, creates ephemeral ID)
*   **POST** `/api/v1/session`
*   **Response:** `{ "sessionId": "uuid", "balanceSat": 0 }`

### 2.2 Transactions (Inbound)
**Create Deposit**
*   **POST** `/api/v1/transactions/deposit`
*   **Body:** `{ "amountSat": 1000, "sessionId": "uuid" }`
*   **Response:**
    ```json
    {
      "id": "txn_uuid",
      "paymentRequest": "lnbc1...",
      "checkoutUrl": "https://checkout.opennode.com/..."
    }
    ```

### 2.3 Game Logic
### 2.2 Game Logic (Pay-Per-Spin)
**Place Bet**
*   **POST** `/api/v1/game/bet`
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
*   **GET** `/api/v1/game/bet/:betId/status`
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
*   **GET** `/api/v1/lnurl/withdraw?k1=...`
*   **Response:**
    ```json
    {
      "tag": "withdrawRequest",
      "callback": "https://api.quantumbtc.io/api/v1/lnurl/callback",
      "k1": "...",
      "defaultDescription": "Quantum BTC Winnings",
      "minWithdrawable": 1000,
      "maxWithdrawable": 1000000
    }
    ```

**Step 2: Wallet Sends Invoice**
*   **GET** `/api/v1/lnurl/callback?k1=...&pr=lnbc1...`
*   **Response:** `{ "status": "OK" }` or `{ "status": "ERROR", "reason": "..." }`

## 4. Webhooks (OpenNode)

**Charge Paid**
*   **POST** `/api/v1/webhooks/opennode`
*   **Headers:** `x-signature: <HMAC>`
*   **Body:**
    ```json
    {
      "id": "charge_id",
      "status": "paid",
      "hashed_order": "secret_hash"
    }
    ```
