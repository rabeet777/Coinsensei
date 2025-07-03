-- Create user_security table for TOTP and other security settings
CREATE TABLE IF NOT EXISTS user_security (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  totp_enabled BOOLEAN DEFAULT FALSE,
  totp_secret TEXT,
  backup_codes TEXT[], -- Array of backup codes
  sms_enabled BOOLEAN DEFAULT FALSE,
  email_2fa_enabled BOOLEAN DEFAULT FALSE,
  last_totp_used_at TIMESTAMPTZ,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON user_security (user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_totp_enabled ON user_security (totp_enabled);
CREATE INDEX IF NOT EXISTS idx_user_security_locked_until ON user_security (locked_until);

-- Enable Row Level Security
ALTER TABLE user_security ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own security settings" ON user_security;
DROP POLICY IF EXISTS "Users can update their own security settings" ON user_security;
DROP POLICY IF EXISTS "Users can insert their own security settings" ON user_security;
DROP POLICY IF EXISTS "Admins can view all security settings" ON user_security;
DROP POLICY IF EXISTS "Service role can manage all security settings" ON user_security;

-- Create RLS policies
CREATE POLICY "Users can view their own security settings" 
ON user_security FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings" 
ON user_security FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security settings" 
ON user_security FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admin policies (if you have admin role in user metadata)
CREATE POLICY "Admins can view all security settings" 
ON user_security FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Service role policy (for API operations)
CREATE POLICY "Service role can manage all security settings" 
ON user_security FOR ALL 
USING (true) 
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_security TO authenticated;
GRANT ALL ON user_security TO service_role;
GRANT USAGE, SELECT ON SEQUENCE user_security_id_seq TO authenticated, service_role;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_security_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_security_updated_at_trigger ON user_security;
CREATE TRIGGER update_user_security_updated_at_trigger
  BEFORE UPDATE ON user_security
  FOR EACH ROW
  EXECUTE FUNCTION update_user_security_updated_at();

-- Add comments
COMMENT ON TABLE user_security IS 'User security settings including TOTP, 2FA, and account locking';
COMMENT ON COLUMN user_security.totp_enabled IS 'Whether TOTP (Time-based OTP) is enabled';
COMMENT ON COLUMN user_security.totp_secret IS 'Encrypted TOTP secret key';
COMMENT ON COLUMN user_security.backup_codes IS 'Array of backup recovery codes';
COMMENT ON COLUMN user_security.login_attempts IS 'Failed login attempt counter';
COMMENT ON COLUMN user_security.locked_until IS 'Account locked until this timestamp'; 