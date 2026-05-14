# Database Schema - QuantumBTC

> **ID:** QM_Database_Schema
> **Version:** 2.0
> **Last Updated:** 2026-05-14
> **Status:** APPROVED

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    SESSION ||--o{ TRANSACTION : initiates
    SESSION ||--o{ BET : places
    SESSION ||--o{ REWARD_REGISTRATION : identifies
    DONATION ||--o{ OPENNODE : "fulfilled via"
    GEO_BLOCK_LOG {
        uuid id PK
        inet ip_address "Blocked IP"
        string country "Country Code"
        timestamp created_at
    }
    SESSION {
        uuid id PK
        inet ip_address "Client IP"
        string country "Country Code"
        timestamp created_at
    }

    TRANSACTION {
        uuid id PK
        uuid session_id FK
        string type "DEPOSIT|WITHDRAW"
        bigint amount_sat
        string provider_id "OpenNode ID"
        string status
        timestamp created_at
    }

    BET {
        uuid id PK
        uuid session_id FK
        string game_type "roulette|plinko"
        bigint amount_sat
        bigint payout_sat
        int[] selected_numbers "DEPRECATED - Use bet_details"
        int final_result "First run outcome (compat)"
        string client_seed
        string server_seed_hash "SHA256(entropy) committed pre-payment"
        string server_seed_reveal "Entropy revealed post-resolution"
        string status "WAITING_PAYMENT|WON|LOST"
        uuid entropy_id FK
        jsonb bet_details "Numbers/weights (Roulette) or rows/risk (Plinko)"
        string invoice_id "OpenNode Charge ID"
        uuid withdrawal_token_id FK
        int runs_count "1|2|5|10 DEFAULT 1"
        jsonb run_results "Per-run outcome data"
        int drand_round "Drand beacon round number"
        string drand_randomness "Drand beacon randomness hex"
        string drand_signature "Drand beacon signature"
        timestamp created_at
    }

    ENTROPY_BUFFER {
        uuid id PK
        text raw_hex_data "ANU Quantum Bytes"
        boolean is_consumed
        uuid consumed_by_bet_id FK
        timestamp created_at
    }
    
    REWARD_REGISTRATION {
        uuid id PK
        uuid session_id FK
        string reward_address "BTC/LN Address"
        timestamp created_at
    }

    DONATION {
        uuid id PK
        string charge_id "OpenNode ID"
        bigint amount_sat
        string address "Optional BTC/LN"
        string status "pending/paid"
        timestamp created_at
    }
```

## 2. Data Dictionary

### 2.1 Table: `sessions`
Typically ephemeral, mostly for audit/logging in non-custodial mode.
*   **id:** UUID v4.
*   **ip_address:** `INET`. Client IP address captured at session initialization for compliance and audit.
*   **country:** `VARCHAR(2)`. The 2-letter ISO country code detected for the session IP.
*   **created_at:** Timestamp.

### 2.2 Table: `bets`
The core ledger of gameplay.
*   **game_type:** `VARCHAR(20)`. Type of game ('roulette', 'plinko'). Defaults to 'roulette'.
*   **amount_sat:** `BIGINT`. The total wager for all runs (from Invoice).
*   **payout_sat:** `BIGINT`. The aggregate win amount across all runs (0 if all lost).
*   **selected_numbers:** `INTEGER[]`. **(DEPRECATED)** Flattened array of roulette numbers from bet positions. Populated at insertion for historical queries but never read by resolution logic. Use `bet_details` instead.
*   **final_result:** `INTEGER`. Stores the first run's outcome for backward compatibility.
*   **client_seed:** `VARCHAR`. User-provided entropy contribution.
*   **server_seed_hash:** `VARCHAR`. `SHA256(entropy)` committed before payment for Provably Fair proof.
*   **server_seed_reveal:** `VARCHAR`. Raw entropy hex revealed after resolution.
*   **runs_count:** `INTEGER`. Number of independent game runs per bet (1, 2, 5, or 10). Defaults to 1.
*   **run_results:** `JSONB`. Per-run outcome data: `{"runs": [{run, outcome, payout_sat, multiplier, path?}]}`. NULL for legacy single-run bets.
*   **bet_details:** `JSONB`. Numbers and amounts per position (Roulette) or risk/rows config (Plinko). This is the authoritative source for payout calculation.
*   **invoice_id:** `VARCHAR(100)`. OpenNode Charge ID linking to the payment.
*   **withdrawal_token_id:** `UUID`. FK to `withdrawal_tokens` (if won).
*   **entropy_id:** `UUID`. FK to `entropy_buffer`.
*   **drand_round:** `BIGINT`. Drand beacon round number at resolution time.
*   **drand_randomness:** `VARCHAR`. Drand beacon randomness hex.
*   **drand_signature:** `VARCHAR`. Drand beacon signature for public verification.
*   **status:** `VARCHAR(20)`. One of: 'WAITING_PAYMENT', 'PROCESSING', 'WON', 'LOST'.

### 2.3 Table: `entropy_buffer`
Pre-fetched quantum randomness.
*   **raw_hex_data:** High-quality entropy from ANU.
*   **is_consumed:** Index for fast retrieval (`WHERE is_consumed = false LIMIT 1`).

### 2.4 Table: `geo_block_logs`
Audit log for blocked IP addresses.
*   **id:** UUID v4.
*   **ip_address:** `INET`. The blocked client IP address.
*   **country:** `VARCHAR(2)`. The 2-letter ISO country code of the blocked IP.
*   **created_at:** Timestamp.

### 2.5 Table: `reward_registrations`
Links a session to a reward address.
*   **session_id:** UUID (FK to `sessions`).
*   **reward_address:** BTC Address or Lightning Address.
*   **created_at:** Timestamp.

### 2.6 Table: `donations`
Records voluntary user contributions. Can be anonymous or associated with an address.
*   **id:** UUID v4.
*   **charge_id:** `VARCHAR`. Link to OpenNode Charge for webhook verification.
*   **amount_sat:** `BIGINT`. The donation amount.
*   **address:** `VARCHAR`. User's provided BTC/LN address (Optional).
*   **status:** 'pending' or 'paid'.
*   **created_at:** Timestamp.

## 3. SQL Schema (schema.sql)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET,
  country VARCHAR(2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE geo_block_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET NOT NULL,
  country VARCHAR(2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE entropy_buffer (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raw_hex_data TEXT NOT NULL,
  is_consumed BOOLEAN DEFAULT FALSE,
  consumed_by_bet_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id),
  game_type VARCHAR(20) DEFAULT 'roulette',
  amount_sat BIGINT NOT NULL,
  payout_sat BIGINT DEFAULT 0,
  selected_numbers INTEGER[] NOT NULL, -- DEPRECATED: Use bet_details JSONB instead
  final_result INTEGER,
  client_seed VARCHAR(255),
  server_seed_hash VARCHAR(255),
  server_seed_reveal VARCHAR(255),
  status VARCHAR(20) DEFAULT 'WAITING_PAYMENT',
  entropy_id UUID REFERENCES entropy_buffer(id),
  bet_details JSONB,
  invoice_id VARCHAR(100),
  withdrawal_token_id UUID REFERENCES withdrawal_tokens(id),
  runs_count INTEGER NOT NULL DEFAULT 1,
  run_results JSONB,
  drand_round BIGINT,
  drand_randomness VARCHAR(255),
  drand_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT runs_count_valid CHECK (runs_count IN (1, 2, 5, 10))
);

CREATE TABLE withdrawal_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id),
  k1 VARCHAR(255) UNIQUE,
  amount_sat BIGINT,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reward_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) UNIQUE,
  reward_address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  charge_id VARCHAR(100) UNIQUE NOT NULL,
  amount_sat BIGINT NOT NULL,
  address VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
