-- Create system_config table for admin settings
CREATE TABLE IF NOT EXISTS public.system_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    sms_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    totp_required BOOLEAN DEFAULT false,
    withdrawal_limit INTEGER DEFAULT 10000,
    maintenance_mode BOOLEAN DEFAULT false,
    api_rate_limit INTEGER DEFAULT 100,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one config row exists
    CONSTRAINT single_config_row CHECK (id = 1)
);

-- Insert default configuration if not exists
INSERT INTO public.system_config (id) 
VALUES (1) 
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access only
CREATE POLICY "Admin can view system config" ON public.system_config
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profile 
            WHERE uid = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admin can update system config" ON public.system_config
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profile 
            WHERE uid = auth.uid() AND is_admin = true
        )
    );

-- Create trigger to update timestamp
CREATE OR REPLACE FUNCTION update_system_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_config_updated_at
    BEFORE UPDATE ON public.system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_system_config_timestamp();

-- Add comment
COMMENT ON TABLE public.system_config IS 'System-wide configuration settings for admin management'; 