-- Create worker registry table for centralized worker management
CREATE TABLE IF NOT EXISTS worker_registry (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'withdrawal', 'deposit', 'consolidation', 'gas-topup'
  blockchain VARCHAR(20) NOT NULL, -- 'tron', 'ethereum', 'bitcoin', 'polygon'
  status VARCHAR(20) DEFAULT 'stopped', -- 'running', 'stopped', 'error', 'maintenance'
  pid INTEGER,
  host VARCHAR(100),
  port INTEGER,
  last_heartbeat TIMESTAMPTZ,
  last_error TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_registry_status ON worker_registry (status);
CREATE INDEX IF NOT EXISTS idx_worker_registry_type ON worker_registry (type);
CREATE INDEX IF NOT EXISTS idx_worker_registry_blockchain ON worker_registry (blockchain);
CREATE INDEX IF NOT EXISTS idx_worker_registry_heartbeat ON worker_registry (last_heartbeat);

-- Enable Row Level Security
ALTER TABLE worker_registry ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage all workers" ON worker_registry;
DROP POLICY IF EXISTS "Service role can manage all workers" ON worker_registry;

-- Create RLS policies
CREATE POLICY "Admins can manage all workers" 
ON worker_registry FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Service role policy (for worker operations)
CREATE POLICY "Service role can manage all workers" 
ON worker_registry FOR ALL 
USING (true) 
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON worker_registry TO authenticated;
GRANT ALL ON worker_registry TO service_role;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_worker_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_worker_registry_updated_at_trigger ON worker_registry;
CREATE TRIGGER update_worker_registry_updated_at_trigger
  BEFORE UPDATE ON worker_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_worker_registry_updated_at();

-- Create worker metrics table for monitoring
CREATE TABLE IF NOT EXISTS worker_metrics (
  id BIGSERIAL PRIMARY KEY,
  worker_id VARCHAR(50) REFERENCES worker_registry(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Performance metrics
  jobs_processed INTEGER DEFAULT 0,
  jobs_successful INTEGER DEFAULT 0,
  jobs_failed INTEGER DEFAULT 0,
  avg_processing_time INTEGER DEFAULT 0, -- milliseconds
  
  -- System metrics
  cpu_usage DECIMAL(5,2) DEFAULT 0, -- percentage
  memory_usage DECIMAL(5,2) DEFAULT 0, -- percentage
  disk_usage DECIMAL(5,2) DEFAULT 0, -- percentage
  
  -- Business metrics
  total_volume_processed DECIMAL(20,6) DEFAULT 0,
  total_fees_collected DECIMAL(20,6) DEFAULT 0,
  error_rate DECIMAL(5,2) DEFAULT 0 -- percentage
);

-- Create indexes for worker metrics
CREATE INDEX IF NOT EXISTS idx_worker_metrics_worker_id ON worker_metrics (worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_metrics_timestamp ON worker_metrics (timestamp);

-- Enable RLS for worker metrics
ALTER TABLE worker_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for worker metrics
CREATE POLICY "Admins can view all worker metrics" 
ON worker_metrics FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Service role can manage all worker metrics" 
ON worker_metrics FOR ALL 
USING (true) 
WITH CHECK (true);

-- Grant permissions for worker metrics
GRANT SELECT ON worker_metrics TO authenticated;
GRANT ALL ON worker_metrics TO service_role;
GRANT USAGE, SELECT ON SEQUENCE worker_metrics_id_seq TO authenticated, service_role;

-- Add comments
COMMENT ON TABLE worker_registry IS 'Registry of all workers in the system';
COMMENT ON COLUMN worker_registry.status IS 'Worker status: running, stopped, error, maintenance';
COMMENT ON COLUMN worker_registry.type IS 'Worker type: withdrawal, deposit, consolidation, gas-topup';
COMMENT ON COLUMN worker_registry.blockchain IS 'Blockchain network: tron, ethereum, bitcoin, polygon';
COMMENT ON COLUMN worker_registry.config IS 'Worker configuration in JSON format';

COMMENT ON TABLE worker_metrics IS 'Performance and business metrics for workers';
COMMENT ON COLUMN worker_metrics.avg_processing_time IS 'Average job processing time in milliseconds';
COMMENT ON COLUMN worker_metrics.error_rate IS 'Error rate as percentage of total jobs';

-- Create helper functions
CREATE OR REPLACE FUNCTION get_worker_status(worker_id_param VARCHAR(50))
RETURNS TABLE (
  id VARCHAR(50),
  name VARCHAR(100),
  status VARCHAR(20),
  last_heartbeat TIMESTAMPTZ,
  is_healthy BOOLEAN,
  uptime_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wr.id,
    wr.name,
    wr.status,
    wr.last_heartbeat,
    (wr.last_heartbeat > NOW() - INTERVAL '2 minutes') AS is_healthy,
    EXTRACT(EPOCH FROM (NOW() - wr.created_at))::INTEGER / 60 AS uptime_minutes
  FROM worker_registry wr
  WHERE wr.id = worker_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_all_workers_health()
RETURNS TABLE (
  total_workers INTEGER,
  running_workers INTEGER,
  healthy_workers INTEGER,
  error_workers INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_workers,
    COUNT(CASE WHEN status = 'running' THEN 1 END)::INTEGER AS running_workers,
    COUNT(CASE WHEN status = 'running' AND last_heartbeat > NOW() - INTERVAL '2 minutes' THEN 1 END)::INTEGER AS healthy_workers,
    COUNT(CASE WHEN status = 'error' THEN 1 END)::INTEGER AS error_workers
  FROM worker_registry;
END;
$$ LANGUAGE plpgsql; 