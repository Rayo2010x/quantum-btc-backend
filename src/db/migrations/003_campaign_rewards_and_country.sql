-- Migration 003: Campaign Rewards and Country Tracking
-- Add country column to sessions (if not exists)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS country VARCHAR(2);

-- Create reward_registrations table
CREATE TABLE IF NOT EXISTS reward_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID UNIQUE REFERENCES sessions(id),
  reward_address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
