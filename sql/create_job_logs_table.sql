-- Create job_logs table for worker management system
-- Tracks all jobs in the system (sync, consolidation, gas-topup)

CREATE TABLE IF NOT EXISTS public.job_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE,
  job_type TEXT NOT NULL CHECK (job_type IN ('sync', 'consolidation', 'gas-topup')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  wallet_address TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Add RLS policies
ALTER TABLE public.job_logs ENABLE ROW LEVEL SECURITY;

-- Allow admin access and user access to their own jobs
CREATE POLICY "Admin can manage all job logs" ON public.job_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profile 
      WHERE uid = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own job logs" ON public.job_logs
  FOR SELECT USING (user_id = auth.uid());

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON public.job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_job_type ON public.job_logs(job_type);
CREATE INDEX IF NOT EXISTS idx_job_logs_status ON public.job_logs(status);
CREATE INDEX IF NOT EXISTS idx_job_logs_wallet_address ON public.job_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_job_logs_user_id ON public.job_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_created_at ON public.job_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_job_logs_status_created_at ON public.job_logs(status, created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_job_logs_updated_at 
  BEFORE UPDATE ON public.job_logs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO public.job_logs (job_id, job_type, status, wallet_address, data) VALUES
  ('sample-sync-001', 'sync', 'completed', 'TTest123456789', '{"type": "routine_sync", "blocks_processed": 100}'),
  ('sample-consolidation-001', 'consolidation', 'pending', 'TTest987654321', '{"type": "manual", "reason": "Admin initiated"}'),
  ('sample-gas-001', 'gas-topup', 'failed', 'TTest555666777', '{"topup_amount": "10", "error": "Insufficient master wallet balance"}')
ON CONFLICT (job_id) DO NOTHING; 