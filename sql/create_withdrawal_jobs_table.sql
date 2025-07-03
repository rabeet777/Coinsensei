-- Create withdrawal_jobs table for simple queue system
CREATE TABLE IF NOT EXISTS withdrawal_jobs (
  id BIGSERIAL PRIMARY KEY,
  withdrawal_id BIGINT REFERENCES withdrawals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_address TEXT NOT NULL,
  amount DECIMAL(20, 6) NOT NULL,
  fee DECIMAL(20, 6) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  tx_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_jobs_status ON withdrawal_jobs (status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_jobs_withdrawal_id ON withdrawal_jobs (withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_jobs_user_id ON withdrawal_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_jobs_created_at ON withdrawal_jobs (created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawal_jobs_status_attempts ON withdrawal_jobs (status, attempts);

-- Enable Row Level Security
ALTER TABLE withdrawal_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own withdrawal jobs" ON withdrawal_jobs;
DROP POLICY IF EXISTS "Admins can view all withdrawal jobs" ON withdrawal_jobs;
DROP POLICY IF EXISTS "Service role can manage all withdrawal jobs" ON withdrawal_jobs;

-- Create RLS policies
CREATE POLICY "Users can view their own withdrawal jobs" 
ON withdrawal_jobs FOR SELECT 
USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all withdrawal jobs" 
ON withdrawal_jobs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Service role policy (for API operations and workers)
CREATE POLICY "Service role can manage all withdrawal jobs" 
ON withdrawal_jobs FOR ALL 
USING (true) 
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON withdrawal_jobs TO authenticated;
GRANT ALL ON withdrawal_jobs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE withdrawal_jobs_id_seq TO authenticated, service_role;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_withdrawal_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_withdrawal_jobs_updated_at_trigger ON withdrawal_jobs;
CREATE TRIGGER update_withdrawal_jobs_updated_at_trigger
  BEFORE UPDATE ON withdrawal_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_withdrawal_jobs_updated_at();

-- Add comments
COMMENT ON TABLE withdrawal_jobs IS 'Simple job queue for withdrawal processing';
COMMENT ON COLUMN withdrawal_jobs.status IS 'Job status: pending, processing, completed, failed';
COMMENT ON COLUMN withdrawal_jobs.attempts IS 'Number of processing attempts';
COMMENT ON COLUMN withdrawal_jobs.tx_hash IS 'Blockchain transaction hash when completed';
COMMENT ON COLUMN withdrawal_jobs.error_message IS 'Error message if job failed'; 