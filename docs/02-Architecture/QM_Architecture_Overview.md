# Architecture Overview - QuantumBTC

> **ID:** QM_Architecture_Overview
> **Version:** 1.1
> **Last Updated:** 2026-04-08
> **Status:** DRAFT

## 1. High-Level System Architecture

The QuantumBTC backend is a monolithic high-performance Node.js application (Fastify) integrated with external services for Lightning payments and entropy generation.

```mermaid
graph TD
    User[User / Client Interface] -->|HTTPS / WSS| API[Fastify API Server]
    
    subgraph "Core Backend"
        API -->|Reads/Writes| DB[(PostgreSQL)]
        Worker[Entropy Worker] -->|Buffers Entropy| DB
    end
    
    subgraph "External Services"
        API <-->|Webhooks / API| OpenNode[OpenNode Payment Processor]
        Worker <-->|HTTPS| ANU[ANU Quantum RNG]
        API <-->|HTTPS| Drand[Drand Public Beacon]
    end
    
    OpenNode -->|Lightning Network| LN[Bitcoin Lightning Network]
```

### Component Roles
1.  **Fastify API Server:** Handles all HTTP requests, game logic, authentication (stateless), and payment orchestration.
2.  **PostgreSQL (Hosted on Supabase):** Primary persistence layer. Stores bets, transactions, and the entropy buffer. Uses `BigInt` for Satoshi precision.
3.  **Entropy Worker:** A background process that aggressively fetches quantum random numbers from ANU. **Includes automatic fallback to standard CSPRNG (Crypto)** if the ANU API limit is reached or returns errors (403/500).
4.  **OpenNode:** Managed node provider for generating invoices and handling LNURL-withdraw requests.
5.  **Drand:** Used as a secondary public beacon to ensure the "provably fair" chain cannot be manipulated by the server alone.

## 2. Satoshi Lifecycle (Data Flows)

### 2.1 Non-Custodial Betting Flow (Pay-Per-Spin)
```mermaid
sequenceDiagram
    participant User
    participant API
    participant OpenNode
    participant DB
    participant ANU_Buffer

    User->>API: Place Bet (Numbers)
    API->>DB: Check Entropy Availability
    API->>DB: Reserve Entropy (Pre-Commitment)
    API->>OpenNode: Create Charge (Amount)
    OpenNode-->>API: BOLT11 Invoice
    API->>DB: Store Bet (Status: WAITING_PAYMENT)
    API-->>User: Show Invoice QR
    
    User->>OpenNode: Pay Invoice (Lightning)
    
    par Async Processing
        OpenNode->>API: Webhook (PAID)
        API->>API: Verify Signature
        API->>DB: Lock Bet Row
        API->>ANU_Buffer: Retrieve Reserved Entropy
        API->>API: Calculate Outcome
        API->>DB: Update Status (WON/LOST) + Result
    and Frontend Polling
        User->>API: Poll Status?
        API-->>User: Status (WAITING/WON/LOST)
    end
```

### 2.2 Prize Claiming Flow (Win)
```mermaid
sequenceDiagram
    participant User
    participant API
    participant DB
    participant OpenNode

    User->>API: Poll Status (WON)
    API->>DB: Check Win & Withdrawal Token
    API-->>User: Return LNURL-Withdraw (QR)
    
    User->>OpenNode: Scan QR (Wallet)
    OpenNode->>API: LNURL Callback
    API->>OpenNode: OK
    OpenNode->>API: Send Invoice (Withdraw)
    API->>OpenNode: Pay Invoice
    API->>DB: Mark Token USED
```
