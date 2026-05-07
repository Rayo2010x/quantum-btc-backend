-- Quantum BTC Backend Schema
-- Version: 1.0
-- Date: 2026-01-30

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SESSIONS
-- Tracks ephemeral user sessions (since we are non-custodial / no-account)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET,
  country VARCHAR(2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 REWARD REGISTRATIONS
-- Links a session to a reward address for Quantum Genesis
CREATE TABLE IF NOT EXISTS reward_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID UNIQUE REFERENCES sessions(id),
  reward_address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 1.1 GEO BLOCK LOGS
-- Tracks attempts to access the API from restricted regions
CREATE TABLE IF NOT EXISTS geo_block_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET NOT NULL,
  country VARCHAR(2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ENTROPY BUFFER
-- Stores pre-fetched quantum randomness from ANU
CREATE TABLE IF NOT EXISTS entropy_buffer (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raw_hex_data TEXT NOT NULL,
  is_consumed BOOLEAN DEFAULT FALSE,
  consumed_by_bet_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entropy_buffer_available ON entropy_buffer (created_at) WHERE is_consumed = FALSE;

-- 3. [DEPRECATED] TRANSACTIONS
-- Removed in v0.1.0 (Non-Custodial Refactor)
-- All financial events are now tracked directly in 'bets' (payouts) and 'withdrawal_tokens'.

-- 4. BETS
-- Specific game round details
CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  game_type VARCHAR(20) DEFAULT 'roulette',
  amount_sat BIGINT NOT NULL CHECK (amount_sat > 0),
  payout_sat BIGINT NOT NULL DEFAULT 0 CHECK (payout_sat >= 0),
  
  -- Game Logic
  selected_numbers INTEGER[] NOT NULL, -- Array of numbers chosen (simplified from single number for future proofing)
  client_seed TEXT NOT NULL,
  server_seed_hash TEXT NOT NULL, -- The hash committed BEFORE the bet
  server_seed_reveal TEXT, -- The seed revealed AFTER the bet
  final_result INTEGER CHECK (final_result >= 0 AND final_result <= 36),
  
  bet_details JSONB, -- Stores breakdown: [{ number: 7, amount: 100 }, ...]

  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'WON', 'LOST')),
  
  -- Entropy Relation
  entropy_id UUID REFERENCES entropy_buffer(id),
  
  -- Drand Audit Data
  drand_round BIGINT,
  drand_randomness VARCHAR(255),
  drand_signature VARCHAR(512),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bets_session ON bets(session_id);

-- 5. WITHDRAWAL TOKENS (LNURL)
CREATE TABLE IF NOT EXISTS withdrawal_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  k1 VARCHAR(255) NOT NULL UNIQUE, -- The secret challenge
  amount_sat BIGINT NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdraw_k1 ON withdrawal_tokens(k1);

-- 6. DONATIONS
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  charge_id VARCHAR(100) UNIQUE NOT NULL,
  amount_sat BIGINT NOT NULL,
  address VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
