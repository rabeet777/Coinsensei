-- Add recovery system tables and columns

-- Add backup recovery codes table
CREATE TABLE IF NOT EXISTS user_recovery_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL, -- Hashed recovery code
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, code_hash)
);

-- Add recovery requests table for admin-assisted recovery
CREATE TABLE IF NOT EXISTS user_recovery_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('lost_device', 'lost_access', 'account_compromise')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  user_message TEXT,
  admin_notes TEXT,
  identity_verification JSONB, -- Store verification documents/info
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Add recovery tokens table for email-based recovery
CREATE TABLE IF NOT EXISTS user_recovery_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('email_recovery', 'emergency_access')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(token_hash)
);

-- Add recovery settings to user_security table
ALTER TABLE user_security 
ADD COLUMN IF NOT EXISTS recovery_codes_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recovery_codes_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS backup_email TEXT,
ADD COLUMN IF NOT EXISTS recovery_phone TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_recovery_codes_user_id ON user_recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recovery_codes_used ON user_recovery_codes(used);
CREATE INDEX IF NOT EXISTS idx_user_recovery_requests_user_id ON user_recovery_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recovery_requests_status ON user_recovery_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_recovery_tokens_user_id ON user_recovery_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recovery_tokens_expires ON user_recovery_tokens(expires_at);

-- Enable RLS on new tables
ALTER TABLE user_recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recovery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recovery_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own recovery codes" ON user_recovery_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recovery codes" ON user_recovery_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recovery codes" ON user_recovery_codes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recovery requests" ON user_recovery_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recovery requests" ON user_recovery_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own recovery tokens" ON user_recovery_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies (assuming you have admin role)
CREATE POLICY "Admins can manage all recovery requests" ON user_recovery_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profile 
      WHERE uid = auth.uid() AND role = 'admin'
    )
  ); 