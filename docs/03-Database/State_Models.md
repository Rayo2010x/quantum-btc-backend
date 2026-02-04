# State Transition Models - Quantum BTC

> **Artifact ID:** 20260130_State_Models_v1.0
> **Version:** 1.0
> **Date:** 2026-01-30
> **Status:** Draft

## 1. Betting & Payment Lifecycle (Pay-Per-Spin)

The atomic lifecycle of a single game round with integrated payment.

```mermaid
stateDiagram-v2
    [*] --> WAITING_PAYMENT : Bet Created (Invoice Generated)
    WAITING_PAYMENT --> PROCESSING : OpenNode Webhook (PAID)
    WAITING_PAYMENT --> EXPIRED : Invoice TTL Reached
    
    PROCESSING --> CONSUMING_ENTROPY : Lock Bet & Fetch Entropy
    CONSUMING_ENTROPY --> CALCULATING : Reveal Hash Chain
    
    CALCULATING --> LOST : Result != Selection
    CALCULATING --> WON : Result == Selection
    
    LOST --> [*] : Game Over
    WON --> WITHDRAWABLE : Token (LNURL) Generated
    WITHDRAWABLE --> [*] : User Claims Prize
```

## 3. Withdrawal Token Lifecycle (LNURL)

```mermaid
stateDiagram-v2
    [*] --> CREATED : User claims Win
    CREATED --> SCANNED : Wallet scans QR (k1 check)
    SCANNED --> INVOICE_RECEIVED : Wallet sends BOLT11
    INVOICE_RECEIVED --> PAYING : OpenNode processing
    PAYING --> SENT : Payment Successful
    PAYING --> FAILED : Routing Error (Retriable)
```
