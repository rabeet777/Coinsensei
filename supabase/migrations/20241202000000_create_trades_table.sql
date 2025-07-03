-- Create trades table to track executed trades between users
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_order_id UUID NOT NULL REFERENCES orders(id),
    seller_order_id UUID NOT NULL REFERENCES orders(id),
    buyer_user_id UUID NOT NULL REFERENCES auth.users(id),
    seller_user_id UUID NOT NULL REFERENCES auth.users(id),
    trade_amount DECIMAL(20, 8) NOT NULL,         -- Amount of USDT traded
    trade_price DECIMAL(20, 8) NOT NULL,          -- Price per USDT in PKR
    total_value DECIMAL(20, 8) NOT NULL,          -- trade_amount * trade_price (PKR value)
    buyer_fee DECIMAL(20, 8) NOT NULL DEFAULT 0,  -- Fee paid by buyer (USDT)
    seller_fee DECIMAL(20, 8) NOT NULL DEFAULT 0, -- Fee paid by seller (USDT equivalent)
    platform_fee_total DECIMAL(20, 8) NOT NULL DEFAULT 0, -- Total platform fee collected (USDT)
    trade_status VARCHAR(20) DEFAULT 'completed', -- completed, refunded, disputed
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trade_details table for additional trade information
CREATE TABLE trade_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    buyer_received_usdt DECIMAL(20, 8) NOT NULL,  -- Net USDT buyer received (after fees)
    seller_received_pkr DECIMAL(20, 8) NOT NULL,  -- Net PKR seller received (after fees)
    buyer_paid_pkr DECIMAL(20, 8) NOT NULL,       -- Total PKR buyer paid
    seller_provided_usdt DECIMAL(20, 8) NOT NULL, -- Total USDT seller provided
    exchange_rate DECIMAL(20, 8) NOT NULL,        -- Effective exchange rate
    fee_rate DECIMAL(5, 4) DEFAULT 0.0015,        -- Fee rate applied (0.15%)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for trades table
CREATE INDEX idx_trades_buyer_user_id ON trades(buyer_user_id);
CREATE INDEX idx_trades_seller_user_id ON trades(seller_user_id);
CREATE INDEX idx_trades_buyer_order_id ON trades(buyer_order_id);
CREATE INDEX idx_trades_seller_order_id ON trades(seller_order_id);
CREATE INDEX idx_trades_executed_at ON trades(executed_at);
CREATE INDEX idx_trades_trade_amount ON trades(trade_amount);
CREATE INDEX idx_trades_trade_price ON trades(trade_price);
CREATE INDEX idx_trades_status ON trades(trade_status);

-- Create indexes for trade_details table
CREATE INDEX idx_trade_details_trade_id ON trade_details(trade_id);

-- Create trigger for trades updated_at
CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing views if they exist
DROP VIEW IF EXISTS admin_trades_view;
DROP VIEW IF EXISTS user_trades_view;

-- Create view for admin trade overview
CREATE VIEW admin_trades_view AS
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
    
    -- Buyer information
    buyer.email as buyer_email,
    bo.type as buyer_order_type,
    bo.price as buyer_order_price,
    bo.amount as buyer_order_amount,
    
    -- Seller information  
    seller.email as seller_email,
    so.type as seller_order_type,
    so.price as seller_order_price,
    so.amount as seller_order_amount,
    
    -- Trade details (with proper joins)
    COALESCE(td.buyer_received_usdt, t.trade_amount - t.buyer_fee) as buyer_received_usdt,
    COALESCE(td.seller_received_pkr, (t.trade_amount - t.seller_fee) * t.trade_price) as seller_received_pkr,
    COALESCE(td.buyer_paid_pkr, t.total_value) as buyer_paid_pkr,
    COALESCE(td.seller_provided_usdt, t.trade_amount) as seller_provided_usdt,
    COALESCE(td.exchange_rate, t.trade_price) as exchange_rate,
    COALESCE(td.fee_rate, 0.0015) as fee_rate

FROM trades t
JOIN auth.users buyer ON t.buyer_user_id = buyer.id
JOIN auth.users seller ON t.seller_user_id = seller.id
JOIN orders bo ON t.buyer_order_id = bo.id
JOIN orders so ON t.seller_order_id = so.id
LEFT JOIN trade_details td ON t.id = td.trade_id
ORDER BY t.executed_at DESC;

-- Create view for user trade history
CREATE VIEW user_trades_view AS
SELECT 
    t.id,
    t.trade_amount,
    t.trade_price,
    t.total_value,
    t.executed_at,
    
    -- User perspective (buyer or seller)
    CASE 
        WHEN t.buyer_user_id = auth.uid() THEN 'buyer'
        WHEN t.seller_user_id = auth.uid() THEN 'seller'
        ELSE 'unknown'
    END as user_role,
    
    CASE 
        WHEN t.buyer_user_id = auth.uid() THEN t.buyer_fee
        WHEN t.seller_user_id = auth.uid() THEN t.seller_fee
        ELSE 0
    END as user_fee,
    
    CASE 
        WHEN t.buyer_user_id = auth.uid() THEN td.buyer_received_usdt
        WHEN t.seller_user_id = auth.uid() THEN td.seller_received_pkr
        ELSE 0
    END as user_received,
    
    CASE 
        WHEN t.buyer_user_id = auth.uid() THEN 'USDT'
        WHEN t.seller_user_id = auth.uid() THEN 'PKR'
        ELSE 'N/A'
    END as received_currency,
    
    -- Order information
    CASE 
        WHEN t.buyer_user_id = auth.uid() THEN bo.id
        WHEN t.seller_user_id = auth.uid() THEN so.id
        ELSE NULL
    END as user_order_id,
    
    CASE 
        WHEN t.buyer_user_id = auth.uid() THEN bo.type
        WHEN t.seller_user_id = auth.uid() THEN so.type
        ELSE NULL
    END as user_order_type

FROM trades t
JOIN orders bo ON t.buyer_order_id = bo.id
JOIN orders so ON t.seller_order_id = so.id
LEFT JOIN trade_details td ON t.id = td.trade_id
WHERE t.buyer_user_id = auth.uid() OR t.seller_user_id = auth.uid()
ORDER BY t.executed_at DESC;

-- RLS policies for trades table
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_details ENABLE ROW LEVEL SECURITY;

-- Users can view their own trades
CREATE POLICY "Users can view own trades" ON trades
    FOR SELECT USING (buyer_user_id = auth.uid() OR seller_user_id = auth.uid());

-- Users can view trade details for their trades
CREATE POLICY "Users can view own trade details" ON trade_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trades 
            WHERE trades.id = trade_details.trade_id 
            AND (trades.buyer_user_id = auth.uid() OR trades.seller_user_id = auth.uid())
        )
    );

-- Only system can insert/update trades (will be done via service role)
CREATE POLICY "System can manage trades" ON trades
    FOR ALL USING (false);

CREATE POLICY "System can manage trade details" ON trade_details
    FOR ALL USING (false); 