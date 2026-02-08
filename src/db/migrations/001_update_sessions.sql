-- Migration: Add ip_address to sessions, remove updated_at
-- Up
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE sessions DROP COLUMN IF EXISTS updated_at;

-- Down
-- ALTER TABLE sessions DROP COLUMN IF EXISTS ip_address;
-- ALTER TABLE sessions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
