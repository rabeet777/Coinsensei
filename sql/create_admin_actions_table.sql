-- Create admin_actions table for logging admin activities
-- Used by worker management system and other admin functions

CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_id TEXT,
  target_type TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Only allow admin access
CREATE POLICY "Admin can manage admin actions" ON public.admin_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profile 
      WHERE uid = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_user_id ON public.admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON public.admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_type ON public.admin_actions(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at);

-- Insert sample data
INSERT INTO public.admin_actions (admin_user_id, action_type, target_type, details) VALUES
  ((SELECT uid FROM public.user_profile WHERE role = 'admin' LIMIT 1), 'workers_start', 'system', '{"action": "start", "timestamp": "2024-01-01T00:00:00Z"}'),
  ((SELECT uid FROM public.user_profile WHERE role = 'admin' LIMIT 1), 'dispatch_consolidation', 'wallet', '{"job_id": "test-123", "wallet_address": "TTest123", "timestamp": "2024-01-01T00:00:00Z"}')
ON CONFLICT DO NOTHING; 