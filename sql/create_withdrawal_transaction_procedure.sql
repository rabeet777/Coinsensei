-- Stored procedure for handling withdrawal transactions atomically
-- Fixed parameter order: parameters with defaults must come last
CREATE OR REPLACE FUNCTION handle_withdrawal_transaction(
  p_user_id UUID,
  p_to_address TEXT,
  p_amount DECIMAL,
  p_fee DECIMAL,
  p_new_sender_balance DECIMAL,
  p_client_provided_id UUID,
  p_is_internal BOOLEAN,
  p_recipient_user_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_withdrawal_id BIGINT;
  v_recipient_balance DECIMAL;
  v_new_recipient_balance DECIMAL;
  v_internal_tx_id TEXT;
BEGIN
  -- Start transaction (implicit in function)
  
  -- Validate input parameters
  IF p_user_id IS NULL OR p_to_address IS NULL OR p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid input parameters';
  END IF;
  
  -- Update sender's balance
  UPDATE user_wallets 
  SET balance = p_new_sender_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sender wallet not found for user_id: %', p_user_id;
  END IF;
  
  -- If internal transfer, update recipient's balance
  IF p_is_internal AND p_recipient_user_id IS NOT NULL THEN
    -- Get current recipient balance
    SELECT balance INTO v_recipient_balance 
    FROM user_wallets 
    WHERE user_id = p_recipient_user_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Recipient wallet not found for user_id: %', p_recipient_user_id;
    END IF;
    
    -- Calculate new recipient balance
    v_new_recipient_balance := v_recipient_balance + p_amount;
    
    -- Update recipient's balance
    UPDATE user_wallets 
    SET balance = v_new_recipient_balance,
        updated_at = NOW()
    WHERE user_id = p_recipient_user_id;
    
    -- Generate internal transaction ID (timestamp + random 4 digits)
    v_internal_tx_id := EXTRACT(EPOCH FROM NOW())::BIGINT || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  
  -- Insert withdrawal record
  INSERT INTO withdrawals (
    client_provided_id,
    user_id,
    to_address,
    amount,
    fee,
    type,
    status,
    tx_id,
    created_at,
    updated_at
  ) VALUES (
    p_client_provided_id,
    p_user_id,
    p_to_address,
    p_amount,
    p_fee,
    CASE WHEN p_is_internal THEN 'internal' ELSE 'onchain' END,
    CASE WHEN p_is_internal THEN 'completed' ELSE 'pending' END,
    CASE WHEN p_is_internal THEN v_internal_tx_id ELSE NULL END,
    NOW(),
    NOW()
  ) RETURNING id INTO v_withdrawal_id;
  
  -- Return success with withdrawal ID
  RETURN json_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'internal_tx_id', v_internal_tx_id,
    'recipient_user_id', p_recipient_user_id,
    'is_internal', p_is_internal
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error with more context
    RAISE EXCEPTION 'Withdrawal transaction failed for user %, amount %: %', p_user_id, p_amount, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (with correct parameter order)
GRANT EXECUTE ON FUNCTION handle_withdrawal_transaction(UUID, TEXT, DECIMAL, DECIMAL, DECIMAL, UUID, BOOLEAN, UUID) TO authenticated;

-- Grant execute permission to service role for API calls
GRANT EXECUTE ON FUNCTION handle_withdrawal_transaction(UUID, TEXT, DECIMAL, DECIMAL, DECIMAL, UUID, BOOLEAN, UUID) TO service_role;

-- Create helper functions for transaction management compatibility
CREATE OR REPLACE FUNCTION begin_transaction() RETURNS VOID AS $$
BEGIN
  -- This is mainly for API compatibility, as functions are already transactional
  -- In PostgreSQL, functions run in their own transaction by default
  PERFORM 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION commit_transaction() RETURNS VOID AS $$
BEGIN
  -- This is mainly for API compatibility, as functions are already transactional
  -- PostgreSQL functions commit automatically on successful completion
  PERFORM 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rollback_transaction() RETURNS VOID AS $$
BEGIN
  -- Force a rollback by raising an exception
  RAISE EXCEPTION 'Transaction manually rolled back';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for helper functions
GRANT EXECUTE ON FUNCTION begin_transaction() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION commit_transaction() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rollback_transaction() TO authenticated, service_role;

-- Add comments for documentation
COMMENT ON FUNCTION handle_withdrawal_transaction IS 'Handles withdrawal transactions atomically with proper balance updates';
COMMENT ON FUNCTION begin_transaction IS 'Compatibility function for transaction management';
COMMENT ON FUNCTION commit_transaction IS 'Compatibility function for transaction management';
COMMENT ON FUNCTION rollback_transaction IS 'Manually rolls back current transaction'; 