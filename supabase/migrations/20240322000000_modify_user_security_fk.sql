-- Create the user_security table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_security (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    totp_enabled BOOLEAN DEFAULT FALSE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    email_enabled BOOLEAN DEFAULT FALSE,
    totp_secret TEXT,
    totp_secret_encrypted TEXT,
    totp_factor_sid TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON user_security(user_id);

-- First drop the existing foreign key constraint
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_security_user_id_fkey'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_security DROP CONSTRAINT user_security_user_id_fkey;
    END IF;
END $$;

-- Re-create the foreign key with ON DELETE SET NULL
ALTER TABLE public.user_security
ADD CONSTRAINT user_security_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- Add deleted_at column if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_security' 
        AND column_name = 'deleted_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_security ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create a function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_auth_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the deleted_at timestamp when user is deleted
    UPDATE public.user_security
    SET deleted_at = NOW(),
        user_id = NULL
    WHERE user_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically handle user deletion
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_deletion(); 