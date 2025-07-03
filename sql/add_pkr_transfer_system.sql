-- Add PKR transfer system with addresses and transfer functionality
-- Note: user_pkr_wallets table already exists from user signup process

-- Add address column to existing user_pkr_wallets table
ALTER TABLE user_pkr_wallets 
ADD COLUMN IF NOT EXISTS address VARCHAR(50) UNIQUE;

-- Create index for address lookups
CREATE INDEX IF NOT EXISTS idx_user_pkr_wallets_address ON user_pkr_wallets(address);

-- Create PKR transfers table to track transfer history
CREATE TABLE IF NOT EXISTS user_pkr_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_pkr_transfers_sender ON user_pkr_transfers(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_pkr_transfers_recipient ON user_pkr_transfers(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_pkr_transfers_created_at ON user_pkr_transfers(created_at);

-- Enable RLS on transfers table
ALTER TABLE user_pkr_transfers ENABLE ROW LEVEL SECURITY;

-- RLS policies for transfers table
CREATE POLICY "Users can view their own transfers" ON user_pkr_transfers
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert their own transfers" ON user_pkr_transfers
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Function to generate unique PKR address for users
CREATE OR REPLACE FUNCTION generate_pkr_address(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  new_address TEXT;
  address_exists BOOLEAN;
  random_suffix TEXT;
BEGIN
  LOOP
    -- Generate 10-digit numeric address: timestamp (4 digits) + random numbers (6 digits)
    random_suffix := LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0');
    new_address := LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT % 10000, 4, '0') || random_suffix;
    
    -- Check if address already exists
    SELECT EXISTS(SELECT 1 FROM user_pkr_wallets WHERE address = new_address) INTO address_exists;
    
    -- If address is unique, exit loop
    IF NOT address_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_address;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure user PKR wallet has address (wallet already exists)
CREATE OR REPLACE FUNCTION ensure_user_pkr_address(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  wallet_address TEXT;
BEGIN
  -- Check if user's PKR wallet already has an address
  SELECT address INTO wallet_address
  FROM user_pkr_wallets
  WHERE user_id = ensure_user_pkr_address.user_id;
  
  -- If no address exists, generate and assign one
  IF wallet_address IS NULL OR wallet_address = '' THEN
    wallet_address := generate_pkr_address(user_id);
    
    UPDATE user_pkr_wallets 
    SET address = wallet_address
    WHERE user_id = ensure_user_pkr_address.user_id;
  END IF;
  
  RETURN wallet_address;
END;
$$ LANGUAGE plpgsql;

-- Function to transfer PKR between users
CREATE OR REPLACE FUNCTION transfer_pkr(
  sender_id UUID,
  recipient_id UUID,
  transfer_amount DECIMAL,
  transfer_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  sender_balance DECIMAL;
  recipient_balance DECIMAL;
  transfer_id UUID;
BEGIN
  -- Validate input
  IF transfer_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be positive';
  END IF;
  
  IF sender_id = recipient_id THEN
    RAISE EXCEPTION 'Cannot transfer to yourself';
  END IF;
  
  -- Lock the rows to prevent concurrent modifications
  SELECT balance INTO sender_balance
  FROM user_pkr_wallets
  WHERE user_id = sender_id
  FOR UPDATE;
  
  SELECT balance INTO recipient_balance
  FROM user_pkr_wallets
  WHERE user_id = recipient_id
  FOR UPDATE;
  
  -- Check if sender has sufficient balance
  IF sender_balance IS NULL THEN
    RAISE EXCEPTION 'Sender wallet not found';
  END IF;
  
  IF recipient_balance IS NULL THEN
    RAISE EXCEPTION 'Recipient wallet not found';
  END IF;
  
  IF sender_balance < transfer_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Perform the transfer
  UPDATE user_pkr_wallets
  SET 
    balance = balance - transfer_amount,
    updated_at = NOW()
  WHERE user_id = sender_id;
  
  UPDATE user_pkr_wallets
  SET 
    balance = balance + transfer_amount,
    updated_at = NOW()
  WHERE user_id = recipient_id;
  
  -- Create transfer record
  INSERT INTO user_pkr_transfers (sender_id, recipient_id, amount, notes, status)
  VALUES (sender_id, recipient_id, transfer_amount, transfer_notes, 'completed')
  RETURNING id INTO transfer_id;
  
  RETURN transfer_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's PKR transfer history
DROP FUNCTION IF EXISTS get_user_pkr_transfers(UUID, INT);
CREATE OR REPLACE FUNCTION get_user_pkr_transfers(target_user_id UUID, limit_count INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  recipient_id UUID,
  amount DECIMAL,
  notes TEXT,
  status VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  is_sender BOOLEAN,
  other_user_name TEXT,
  other_user_address TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.sender_id,
    t.recipient_id,
    t.amount,
    t.notes,
    t.status,
    t.created_at,
    (t.sender_id = target_user_id) as is_sender,
    CASE 
      WHEN t.sender_id = target_user_id THEN rp.full_name
      ELSE sp.full_name
    END as other_user_name,
    CASE 
      WHEN t.sender_id = target_user_id THEN rw.address
      ELSE sw.address
    END as other_user_address
  FROM user_pkr_transfers t
  LEFT JOIN user_profile sp ON t.sender_id = sp.uid
  LEFT JOIN user_profile rp ON t.recipient_id = rp.uid
  LEFT JOIN user_pkr_wallets sw ON t.sender_id = sw.user_id
  LEFT JOIN user_pkr_wallets rw ON t.recipient_id = rw.user_id
  WHERE t.sender_id = target_user_id OR t.recipient_id = target_user_id
  ORDER BY t.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Update existing PKR wallets to have addresses
DO $$
DECLARE
  wallet_record RECORD;
  new_address TEXT;
BEGIN
  FOR wallet_record IN 
    SELECT user_id FROM user_pkr_wallets WHERE address IS NULL OR address = ''
  LOOP
    new_address := generate_pkr_address(wallet_record.user_id);
    UPDATE user_pkr_wallets 
    SET address = new_address 
    WHERE user_id = wallet_record.user_id;
  END LOOP;
END $$; 