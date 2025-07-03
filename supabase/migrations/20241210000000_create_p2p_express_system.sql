-- Create P2P Express System
-- This system allows users to buy/sell USDT using PKR through admin-controlled rates

-- P2P Express configuration table
CREATE TABLE IF NOT EXISTS p2p_express_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buy_rate DECIMAL(10,4) NOT NULL DEFAULT 275.0000, -- PKR per USDT when users buy USDT
  sell_rate DECIMAL(10,4) NOT NULL DEFAULT 270.0000, -- PKR per USDT when users sell USDT
  min_order_amount DECIMAL(15,2) NOT NULL DEFAULT 100.00, -- Minimum USDT amount
  max_order_amount DECIMAL(15,2) NOT NULL DEFAULT 10000.00, -- Maximum USDT amount
  is_active BOOLEAN NOT NULL DEFAULT true, -- System on/off switch
  daily_buy_limit DECIMAL(15,2) NOT NULL DEFAULT 50000.00, -- Daily buy limit per user
  daily_sell_limit DECIMAL(15,2) NOT NULL DEFAULT 50000.00, -- Daily sell limit per user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- P2P Express orders table
CREATE TABLE IF NOT EXISTS p2p_express_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('buy', 'sell')),
  usdt_amount DECIMAL(15,8) NOT NULL CHECK (usdt_amount > 0),
  pkr_amount DECIMAL(15,2) NOT NULL CHECK (pkr_amount > 0),
  rate DECIMAL(10,4) NOT NULL CHECK (rate > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  admin_processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- P2P Express daily limits tracking
CREATE TABLE IF NOT EXISTS p2p_express_daily_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_buy_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_sell_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, trade_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_p2p_express_orders_user_id ON p2p_express_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_p2p_express_orders_status ON p2p_express_orders(status);
CREATE INDEX IF NOT EXISTS idx_p2p_express_orders_created_at ON p2p_express_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_p2p_express_orders_order_type ON p2p_express_orders(order_type);
CREATE INDEX IF NOT EXISTS idx_p2p_express_daily_limits_user_date ON p2p_express_daily_limits(user_id, trade_date);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_p2p_express_config_updated_at BEFORE UPDATE ON p2p_express_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_p2p_express_orders_updated_at BEFORE UPDATE ON p2p_express_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_p2p_express_daily_limits_updated_at BEFORE UPDATE ON p2p_express_daily_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE p2p_express_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_express_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_express_daily_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Config table: Only admins can access
CREATE POLICY "Admin can manage P2P config" ON p2p_express_config FOR ALL USING (auth.role() = 'admin');

-- Orders table: Users can see their own orders, admin can see all
CREATE POLICY "Users can view own P2P orders" ON p2p_express_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own P2P orders" ON p2p_express_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can manage all P2P orders" ON p2p_express_orders FOR ALL USING (auth.role() = 'admin');

-- Daily limits: Users can see their own limits, admin can see all
CREATE POLICY "Users can view own daily limits" ON p2p_express_daily_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily limits" ON p2p_express_daily_limits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can manage all daily limits" ON p2p_express_daily_limits FOR ALL USING (auth.role() = 'admin');

-- Insert default configuration
INSERT INTO p2p_express_config (buy_rate, sell_rate, min_order_amount, max_order_amount, is_active, daily_buy_limit, daily_sell_limit)
VALUES (275.0000, 270.0000, 100.00, 10000.00, true, 50000.00, 50000.00)
ON CONFLICT DO NOTHING;

-- Function to get current P2P rates and config
CREATE OR REPLACE FUNCTION get_p2p_express_config()
RETURNS TABLE (
  buy_rate DECIMAL(10,4),
  sell_rate DECIMAL(10,4),
  min_order_amount DECIMAL(15,2),
  max_order_amount DECIMAL(15,2),
  is_active BOOLEAN,
  daily_buy_limit DECIMAL(15,2),
  daily_sell_limit DECIMAL(15,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.buy_rate,
    c.sell_rate,
    c.min_order_amount,
    c.max_order_amount,
    c.is_active,
    c.daily_buy_limit,
    c.daily_sell_limit
  FROM p2p_express_config c
  ORDER BY c.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user's daily limits
CREATE OR REPLACE FUNCTION get_user_daily_p2p_limits(target_user_id UUID)
RETURNS TABLE (
  total_buy_amount DECIMAL(15,2),
  total_sell_amount DECIMAL(15,2),
  remaining_buy_limit DECIMAL(15,2),
  remaining_sell_limit DECIMAL(15,2)
) AS $$
DECLARE
  config_buy_limit DECIMAL(15,2);
  config_sell_limit DECIMAL(15,2);
  user_buy_amount DECIMAL(15,2) := 0;
  user_sell_amount DECIMAL(15,2) := 0;
BEGIN
  -- Get config limits
  SELECT daily_buy_limit, daily_sell_limit 
  INTO config_buy_limit, config_sell_limit
  FROM p2p_express_config 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Get user's daily usage
  SELECT COALESCE(total_buy_amount, 0), COALESCE(total_sell_amount, 0)
  INTO user_buy_amount, user_sell_amount
  FROM p2p_express_daily_limits
  WHERE user_id = target_user_id AND trade_date = CURRENT_DATE;
  
  RETURN QUERY
  SELECT 
    user_buy_amount,
    user_sell_amount,
    GREATEST(0, config_buy_limit - user_buy_amount) AS remaining_buy_limit,
    GREATEST(0, config_sell_limit - user_sell_amount) AS remaining_sell_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process P2P Express order
CREATE OR REPLACE FUNCTION process_p2p_express_order(
  target_user_id UUID,
  order_type_param VARCHAR(10),
  usdt_amount_param DECIMAL(15,8),
  expected_rate DECIMAL(10,4)
)
RETURNS UUID AS $$
DECLARE
  order_id UUID;
  current_config RECORD;
  user_pkr_balance DECIMAL(15,2);
  user_usdt_balance DECIMAL(15,8);
  pkr_amount_param DECIMAL(15,2);
  daily_limits RECORD;
  current_rate DECIMAL(10,4);
BEGIN
  -- Get current config
  SELECT * INTO current_config FROM get_p2p_express_config() LIMIT 1;
  
  -- Check if system is active
  IF NOT current_config.is_active THEN
    RAISE EXCEPTION 'P2P Express system is currently unavailable';
  END IF;
  
  -- Validate order type and get current rate
  IF order_type_param = 'buy' THEN
    current_rate := current_config.buy_rate;
  ELSIF order_type_param = 'sell' THEN
    current_rate := current_config.sell_rate;
  ELSE
    RAISE EXCEPTION 'Invalid order type';
  END IF;
  
  -- Check if rate matches expected rate (prevent rate changes during order)
  IF current_rate != expected_rate THEN
    RAISE EXCEPTION 'Rate has changed. Please refresh and try again';
  END IF;
  
  -- Validate order amount
  IF usdt_amount_param < current_config.min_order_amount OR usdt_amount_param > current_config.max_order_amount THEN
    RAISE EXCEPTION 'Order amount outside allowed limits';
  END IF;
  
  -- Calculate PKR amount
  pkr_amount_param := usdt_amount_param * current_rate;
  
  -- Check daily limits
  SELECT * INTO daily_limits FROM get_user_daily_p2p_limits(target_user_id);
  
  IF order_type_param = 'buy' AND usdt_amount_param > daily_limits.remaining_buy_limit THEN
    RAISE EXCEPTION 'Daily buy limit exceeded';
  END IF;
  
  IF order_type_param = 'sell' AND usdt_amount_param > daily_limits.remaining_sell_limit THEN
    RAISE EXCEPTION 'Daily sell limit exceeded';
  END IF;
  
  -- Get user balances with row locking
  SELECT balance INTO user_pkr_balance
  FROM user_pkr_wallets
  WHERE user_id = target_user_id
  FOR UPDATE;
  
  SELECT balance INTO user_usdt_balance
  FROM user_wallets
  WHERE user_id = target_user_id
  FOR UPDATE;
  
  -- Validate balances
  IF order_type_param = 'buy' THEN
    -- User buying USDT with PKR
    IF user_pkr_balance < pkr_amount_param THEN
      RAISE EXCEPTION 'Insufficient PKR balance';
    END IF;
  ELSE
    -- User selling USDT for PKR
    IF user_usdt_balance < usdt_amount_param THEN
      RAISE EXCEPTION 'Insufficient USDT balance';
    END IF;
  END IF;
  
  -- Create order record
  INSERT INTO p2p_express_orders (user_id, order_type, usdt_amount, pkr_amount, rate, status)
  VALUES (target_user_id, order_type_param, usdt_amount_param, pkr_amount_param, current_rate, 'completed')
  RETURNING id INTO order_id;
  
  -- Update balances
  IF order_type_param = 'buy' THEN
    -- Deduct PKR, add USDT
    UPDATE user_pkr_wallets 
    SET balance = balance - pkr_amount_param, updated_at = NOW()
    WHERE user_id = target_user_id;
    
    UPDATE user_wallets 
    SET balance = balance + usdt_amount_param, updated_at = NOW()
    WHERE user_id = target_user_id;
  ELSE
    -- Deduct USDT, add PKR
    UPDATE user_wallets 
    SET balance = balance - usdt_amount_param, updated_at = NOW()
    WHERE user_id = target_user_id;
    
    UPDATE user_pkr_wallets 
    SET balance = balance + pkr_amount_param, updated_at = NOW()
    WHERE user_id = target_user_id;
  END IF;
  
  -- Update daily limits
  INSERT INTO p2p_express_daily_limits (user_id, trade_date, total_buy_amount, total_sell_amount)
  VALUES (
    target_user_id, 
    CURRENT_DATE,
    CASE WHEN order_type_param = 'buy' THEN usdt_amount_param ELSE 0 END,
    CASE WHEN order_type_param = 'sell' THEN usdt_amount_param ELSE 0 END
  )
  ON CONFLICT (user_id, trade_date) DO UPDATE SET
    total_buy_amount = p2p_express_daily_limits.total_buy_amount + 
      CASE WHEN order_type_param = 'buy' THEN usdt_amount_param ELSE 0 END,
    total_sell_amount = p2p_express_daily_limits.total_sell_amount +
      CASE WHEN order_type_param = 'sell' THEN usdt_amount_param ELSE 0 END,
    updated_at = NOW();
  
  RETURN order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's P2P order history
CREATE OR REPLACE FUNCTION get_user_p2p_orders(target_user_id UUID, limit_count INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  order_type VARCHAR(10),
  usdt_amount DECIMAL(15,8),
  pkr_amount DECIMAL(15,2),
  rate DECIMAL(10,4),
  status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_type,
    o.usdt_amount,
    o.pkr_amount,
    o.rate,
    o.status,
    o.created_at
  FROM p2p_express_orders o
  WHERE o.user_id = target_user_id
  ORDER BY o.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 