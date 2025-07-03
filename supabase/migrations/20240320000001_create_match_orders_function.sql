-- Function to find matching orders
CREATE OR REPLACE FUNCTION match_orders_rpc(
  p_order_id UUID,
  p_price DECIMAL,
  p_amount DECIMAL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type order_type,
  price DECIMAL,
  amount DECIMAL,
  filled DECIMAL,
  status order_status,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_order_type order_type;
BEGIN
  -- Get the type of the order we're matching
  SELECT o.type INTO v_order_type
  FROM orders o
  WHERE o.id = p_order_id;

  -- Return matching orders based on type
  IF v_order_type = 'buy' THEN
    -- For buy orders, find sell orders with price <= buy price
    RETURN QUERY
    SELECT 
      o.id, 
      o.user_id, 
      o.type, 
      o.price, 
      o.amount, 
      COALESCE(o.filled, 0), 
      o.status, 
      o.created_at
    FROM orders o
    WHERE o.type = 'sell'
      AND o.status = 'pending'
      AND o.price <= p_price
      AND o.id != p_order_id
      AND (o.amount - COALESCE(o.filled, 0)) > 0
    ORDER BY o.price ASC, o.created_at ASC
    LIMIT 10;
  ELSE
    -- For sell orders, find buy orders with price >= sell price
    RETURN QUERY
    SELECT 
      o.id, 
      o.user_id, 
      o.type, 
      o.price, 
      o.amount, 
      COALESCE(o.filled, 0), 
      o.status, 
      o.created_at
    FROM orders o
    WHERE o.type = 'buy'
      AND o.status = 'pending'
      AND o.price >= p_price
      AND o.id != p_order_id
      AND (o.amount - COALESCE(o.filled, 0)) > 0
    ORDER BY o.price DESC, o.created_at ASC
    LIMIT 10;
  END IF;
END;
$$ LANGUAGE plpgsql; 