-- Add fee tracking to orders table
ALTER TABLE orders ADD COLUMN fee_amount DECIMAL(20, 8) DEFAULT 0;
ALTER TABLE orders ADD COLUMN fee_currency VARCHAR(10) DEFAULT 'USDT';

-- Create platform fees collection table
CREATE TABLE platform_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    fee_amount DECIMAL(20, 8) NOT NULL,
    fee_currency VARCHAR(10) NOT NULL DEFAULT 'USDT',
    order_type order_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create platform wallet for collecting fees
CREATE TABLE platform_wallets (
    currency VARCHAR(10) PRIMARY KEY,
    balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
    total_collected DECIMAL(20, 8) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial platform wallet records
INSERT INTO platform_wallets (currency) VALUES ('USDT'), ('PKR');

-- Create trigger for platform_wallets updated_at
CREATE TRIGGER update_platform_wallets_updated_at
    BEFORE UPDATE ON platform_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RPC function to atomically increment platform wallet
CREATE OR REPLACE FUNCTION increment_platform_wallet(
    currency_param VARCHAR(10),
    amount_param DECIMAL(20, 8)
)
RETURNS VOID AS $$
BEGIN
    UPDATE platform_wallets 
    SET 
        balance = balance + amount_param,
        total_collected = total_collected + amount_param,
        updated_at = NOW()
    WHERE currency = currency_param;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX idx_platform_fees_user_id ON platform_fees(user_id);
CREATE INDEX idx_platform_fees_order_id ON platform_fees(order_id);
CREATE INDEX idx_orders_fee_amount ON orders(fee_amount);

-- Add filled column if it doesn't exist (for partial order tracking)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'filled') THEN
        ALTER TABLE orders ADD COLUMN filled DECIMAL(20, 8) DEFAULT 0;
    END IF;
END $$; 