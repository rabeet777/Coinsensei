-- Drop existing views if they exist to avoid conflicts
DROP VIEW IF EXISTS admin_trades_view CASCADE;
DROP VIEW IF EXISTS user_trades_view CASCADE;

-- Create comprehensive view for admin trades management
CREATE OR REPLACE VIEW admin_trades_view AS
SELECT 
    t.id,
    t.trade_amount,
    t.trade_price,
    t.total_value,
    t.buyer_fee,
    t.seller_fee,
    t.platform_fee_total,
    t.trade_status,
    t.executed_at,
    t.buyer_user_id,
    t.seller_user_id,
    t.buyer_order_id,
    t.seller_order_id,
    
    -- Fields from trade_details
    COALESCE(td.exchange_rate, t.trade_price) as exchange_rate,
    COALESCE(td.fee_rate, 0.0015) as fee_rate,
    COALESCE(td.buyer_received_usdt, t.trade_amount - t.buyer_fee) as buyer_received_usdt,
    COALESCE(td.seller_received_pkr, (t.trade_amount - t.seller_fee) * t.trade_price) as seller_received_pkr,
    
    -- Buyer information
    buyer_profile.email as buyer_email,
    buyer_profile.created_at as buyer_joined_at,
    buyer_order.type as buyer_order_type,
    
    -- Seller information  
    seller_profile.email as seller_email,
    seller_profile.created_at as seller_joined_at,
    seller_order.type as seller_order_type,
    
    -- Additional metadata
    t.created_at,
    t.updated_at
FROM trades t
LEFT JOIN trade_details td ON t.id = td.trade_id
LEFT JOIN auth.users buyer_profile ON t.buyer_user_id = buyer_profile.id
LEFT JOIN auth.users seller_profile ON t.seller_user_id = seller_profile.id
LEFT JOIN orders buyer_order ON t.buyer_order_id = buyer_order.id
LEFT JOIN orders seller_order ON t.seller_order_id = seller_order.id;

-- Create view for user trade history
CREATE OR REPLACE VIEW user_trades_view AS
SELECT 
    t.id,
    t.trade_amount,
    t.trade_price,
    t.total_value,
    t.buyer_fee,
    t.seller_fee,
    t.platform_fee_total,
    t.trade_status,
    t.executed_at,
    t.buyer_user_id,
    t.seller_user_id,
    
    -- Fields from trade_details with fallbacks
    COALESCE(td.exchange_rate, t.trade_price) as exchange_rate,
    COALESCE(td.buyer_received_usdt, t.trade_amount - t.buyer_fee) as buyer_received_usdt,
    COALESCE(td.seller_received_pkr, (t.trade_amount - t.seller_fee) * t.trade_price) as seller_received_pkr,
    
    -- Buyer information
    buyer_profile.email as buyer_email,
    
    -- Seller information  
    seller_profile.email as seller_email,
    
    -- Dynamic fields based on user perspective
    CASE 
        WHEN t.buyer_user_id = auth.uid() THEN 'buyer'
        WHEN t.seller_user_id = auth.uid() THEN 'seller'
        ELSE NULL
    END as user_role,
    
    CASE 
        WHEN t.buyer_user_id = auth.uid() THEN COALESCE(td.buyer_received_usdt, t.trade_amount - t.buyer_fee)
        WHEN t.seller_user_id = auth.uid() THEN COALESCE(td.seller_received_pkr, (t.trade_amount - t.seller_fee) * t.trade_price)
        ELSE NULL
    END as user_received_amount,
    
    CASE 
        WHEN t.buyer_user_id = auth.uid() THEN 'USDT'
        WHEN t.seller_user_id = auth.uid() THEN 'PKR'
        ELSE NULL
    END as user_received_currency,
    
    CASE 
        WHEN t.buyer_user_id = auth.uid() THEN seller_profile.email
        WHEN t.seller_user_id = auth.uid() THEN buyer_profile.email
        ELSE NULL
    END as counterparty_email,
    
    -- Additional metadata
    t.created_at,
    t.updated_at
FROM trades t
LEFT JOIN trade_details td ON t.id = td.trade_id
LEFT JOIN auth.users buyer_profile ON t.buyer_user_id = buyer_profile.id
LEFT JOIN auth.users seller_profile ON t.seller_user_id = seller_profile.id
WHERE (t.buyer_user_id = auth.uid() OR t.seller_user_id = auth.uid())
AND t.trade_status = 'completed';

-- Enable RLS on views (inherits from base table policies)
ALTER VIEW admin_trades_view OWNER TO postgres;
ALTER VIEW user_trades_view OWNER TO postgres;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trades_buyer_user_id ON trades(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_trades_seller_user_id ON trades(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_trades_executed_at ON trades(executed_at);
CREATE INDEX IF NOT EXISTS idx_trades_trade_status ON trades(trade_status);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_trades_status_executed_at ON trades(trade_status, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON trades(buyer_user_id, seller_user_id, trade_status); 