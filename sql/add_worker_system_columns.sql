-- Add missing columns to user_wallets table for worker system functionality

-- Add columns if they don't exist
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS needs_consolidation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_gas BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_processing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_user_wallets_updated_at ON user_wallets;
CREATE TRIGGER update_user_wallets_updated_at 
  BEFORE UPDATE ON user_wallets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_user_wallets_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_needs_consolidation ON user_wallets(needs_consolidation);
CREATE INDEX IF NOT EXISTS idx_user_wallets_needs_gas ON user_wallets(needs_gas);
CREATE INDEX IF NOT EXISTS idx_user_wallets_is_processing ON user_wallets(is_processing);
CREATE INDEX IF NOT EXISTS idx_user_wallets_updated_at ON user_wallets(updated_at);

-- Update existing records to have proper default values
UPDATE user_wallets SET 
  needs_consolidation = FALSE,
  needs_gas = FALSE,
  is_processing = FALSE,
  updated_at = NOW()
WHERE needs_consolidation IS NULL 
   OR needs_gas IS NULL 
   OR is_processing IS NULL 
   OR updated_at IS NULL; 