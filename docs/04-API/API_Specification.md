# API Specification - Quantum BTC

> **Artifact ID:** 20260130_API_Specification_v1.9
> **Version:** 1.9
> **Date:** 2026-03-21
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
      "bets": [
        { "numbers": [0], "amount": 100 },
        { "numbers": [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36], "amount": 500 }
      ],
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
      "serverSeedReveal": "a1b2...",
      "clientSeed": "user_provided_entropy",
      "drandRound": 1234567,
      "drandRandomness": "89ab...",
      "drandSignature": "cd34...",
      "lnurlWithdraw": "lnurl1..." // Only if WON
    }
    ```

**Get Session History**
*   **GET** `/v1/game/history?sessionId=uuid`
*   **Response:**
    ```json
    {
      "history": [
        {
          "id": "uuid",
          "amountSat": 100,
          "payoutSat": 0,
          "status": "LOST",
          "outcome": 0,
          "createdAt": "2026-03-04T12:00:00Z"
        }
      ]
    }
    ```

### 2.3 Campaign Management
**Register for Rewards** (Links session to address)
*   **POST** `/v1/campaign/register`
*   **Body:**
    ```json
    {
      "sessionId": "uuid",
      "rewardAddress": "bc1... or user@ln.address"
    }
    ```
*   **Response:** `{ "message": "Registration successful", "registrationId": "uuid" }`
*   **Notes:** A session can only be registered once.

**Check Registration Status**
*   **GET** `/v1/campaign/check?sessionId=uuid`
*   **Response:**
    ```json
    {
      "registered": true | false,
      "rewardAddress": "...", // Only if true
      "totalContributed": 12500 // Aggregated for this address
    }
    ```

### 2.4 Donations Management
**Create Donation Invoice**
*   **POST** `/v1/donations/create`
*   **Body:**
    ```json
    {
      "amountSat": 10000,
      "address": "bc1... or user@ln.address" // Optional
    }
    ```
*   **Response:**
    ```json
    {
      "id": "uuid",
      "paymentRequest": "lnbc1...",
      "chargeId": "opennode_id"
    }
    ```

**Check Donation Status**
*   **GET** `/v1/donations/:id/status`
*   **Response:**
    ```json
    {
      "status": "pending | paid"
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
*   **Security Notes:**
    *   **Amount Validation:** The `amount` in the provided BOLT11 invoice (`pr`) MUST be less than or equal to the authorized `maxWithdrawable` amount.
    *   **Expiration:** The callback will be rejected if the `k1` token has expired.

## 4. Webhooks (OpenNode)

**Charge Paid**
*   **POST** `/v1/webhooks/opennode`
*   **Content-Type:** `application/x-www-form-urlencoded`
*   **Headers:** `x-signature: <HMAC>`
*   **Body:**
    ```
    charge_id=...&status=paid&...
    ```
