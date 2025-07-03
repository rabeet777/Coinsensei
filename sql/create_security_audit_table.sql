-- Create security audit logs table for tracking all security events
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance (separate statements)
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON security_audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_action ON security_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_security_audit_timestamp ON security_audit_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_security_audit_ip ON security_audit_logs (ip_address);

-- Create RLS policies for security
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admin can read audit logs" ON security_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON security_audit_logs
  FOR INSERT WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE security_audit_logs IS 'Security audit trail for all sensitive operations';
COMMENT ON COLUMN security_audit_logs.action IS 'Action type (e.g., WITHDRAWAL_SUCCESS, LOGIN_FAILED)';
COMMENT ON COLUMN security_audit_logs.metadata IS 'Additional context data as JSON';
COMMENT ON COLUMN security_audit_logs.ip_address IS 'Client IP address';
COMMENT ON COLUMN security_audit_logs.user_agent IS 'Client user agent string'; 