-- Create foreign key relationships for better data integrity
-- This fixes the relationship error between user_wallets and user_profile

-- Add foreign key constraint from user_wallets.user_id to user_profile.uid
-- Note: This assumes both tables already exist

-- First, let's make sure we don't have orphaned records
DELETE FROM user_wallets 
WHERE user_id NOT IN (SELECT uid FROM user_profile);

-- Add the foreign key constraint
ALTER TABLE user_wallets 
ADD CONSTRAINT fk_user_wallets_user_profile 
FOREIGN KEY (user_id) REFERENCES user_profile(uid) ON DELETE CASCADE;

-- Similarly for user_pkr_wallets if it exists
DO $$ 
BEGIN
    -- Check if user_pkr_wallets table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_pkr_wallets') THEN
        -- Clean up orphaned records
        DELETE FROM user_pkr_wallets 
        WHERE user_id NOT IN (SELECT uid FROM user_profile);
        
        -- Add foreign key constraint
        ALTER TABLE user_pkr_wallets 
        ADD CONSTRAINT fk_user_pkr_wallets_user_profile 
        FOREIGN KEY (user_id) REFERENCES user_profile(uid) ON DELETE CASCADE;
    END IF;
END $$;

-- Add index for better performance on foreign key lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pkr_wallets_user_id ON user_pkr_wallets(user_id); 