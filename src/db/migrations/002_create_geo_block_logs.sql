-- Migration: Create geo_block_logs table
-- Up
CREATE TABLE IF NOT EXISTS geo_block_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET NOT NULL,
  country VARCHAR(2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Down
-- DROP TABLE IF EXISTS geo_block_logs;
