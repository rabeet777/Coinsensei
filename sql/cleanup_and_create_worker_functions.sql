-- Comprehensive cleanup and creation of worker functions
-- This script aggressively removes all conflicting functions and creates new ones

-- Step 1: Find and drop ALL functions that might conflict
DO $$
DECLARE
    func_name TEXT;
    func_args TEXT;
    drop_stmt TEXT;
BEGIN
    -- Drop all get_and_lock_job variants
    FOR func_name, func_args IN 
        SELECT p.proname, pg_get_function_identity_arguments(p.oid)
        FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE p.proname = 'get_and_lock_job' 
        AND n.nspname = 'public'
    LOOP
        drop_stmt := format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 'public', func_name, func_args);
        RAISE NOTICE 'Executing: %', drop_stmt;
        EXECUTE drop_stmt;
    END LOOP;
    
    -- Drop other potentially conflicting functions
    FOR func_name, func_args IN 
        SELECT p.proname, pg_get_function_identity_arguments(p.oid)
        FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE p.proname IN ('get_pending_jobs_count', 'mark_job_processing', 'complete_job', 'fail_job')
        AND n.nspname = 'public'
    LOOP
        drop_stmt := format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 'public', func_name, func_args);
        RAISE NOTICE 'Executing: %', drop_stmt;
        EXECUTE drop_stmt;
    END LOOP;
END $$;

-- Step 2: Create new functions with completely unique names to avoid any conflicts

-- 1. Job fetching and locking function
CREATE FUNCTION coinsensei_get_jobs(
  p_job_type TEXT,
  p_status TEXT DEFAULT 'pending',
  p_limit INTEGER DEFAULT 5
) RETURNS SETOF job_logs AS $$
BEGIN
  -- Select and lock available jobs using FOR UPDATE SKIP LOCKED
  RETURN QUERY
  SELECT *
  FROM job_logs
  WHERE job_type = p_job_type
    AND status = p_status
    AND retry_count < max_retries
  ORDER BY created_at ASC
  LIMIT p_limit
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION coinsensei_get_jobs(TEXT, TEXT, INTEGER) TO authenticated, service_role;

-- 2. Count pending jobs
CREATE FUNCTION coinsensei_count_pending_jobs(p_job_type TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM job_logs
    WHERE job_type = p_job_type
      AND status = 'pending'
      AND retry_count < max_retries
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION coinsensei_count_pending_jobs(TEXT) TO authenticated, service_role;

-- 3. Mark job as processing
CREATE FUNCTION coinsensei_start_job(p_job_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Try to update job status to processing
  UPDATE job_logs
  SET status = 'active',
      started_at = NOW(),
      updated_at = NOW()
  WHERE job_id = p_job_id
    AND status = 'pending'
    AND retry_count < max_retries;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION coinsensei_start_job(TEXT) TO authenticated, service_role;

-- 4. Complete a job
CREATE FUNCTION coinsensei_complete_job(
  p_job_id TEXT,
  p_result JSONB DEFAULT '{}'
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE job_logs
  SET status = 'completed',
      completed_at = NOW(),
      updated_at = NOW(),
      data = COALESCE(data, '{}') || p_result
  WHERE job_id = p_job_id
    AND status = 'active';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION coinsensei_complete_job(TEXT, JSONB) TO authenticated, service_role;

-- 5. Fail a job
CREATE FUNCTION coinsensei_fail_job(
  p_job_id TEXT,
  p_error_message TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  current_retry_count INTEGER;
  max_retry_count INTEGER;
BEGIN
  -- Get current retry counts
  SELECT retry_count, max_retries
  INTO current_retry_count, max_retry_count
  FROM job_logs
  WHERE job_id = p_job_id;
  
  -- Increment retry count
  current_retry_count := COALESCE(current_retry_count, 0) + 1;
  
  -- Determine final status
  IF current_retry_count >= max_retry_count THEN
    -- Mark as permanently failed
    UPDATE job_logs
    SET status = 'failed',
        retry_count = current_retry_count,
        error_message = p_error_message,
        completed_at = NOW(),
        updated_at = NOW(),
        started_at = NULL
    WHERE job_id = p_job_id;
  ELSE
    -- Mark for retry
    UPDATE job_logs
    SET status = 'pending',
        retry_count = current_retry_count,
        error_message = p_error_message,
        updated_at = NOW(),
        started_at = NULL
    WHERE job_id = p_job_id;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION coinsensei_fail_job(TEXT, TEXT) TO authenticated, service_role;

-- Step 3: Create backward compatibility aliases (if needed by existing workers)
CREATE FUNCTION get_and_lock_job(
  p_job_type TEXT,
  p_status TEXT DEFAULT 'pending'
) RETURNS SETOF job_logs AS $$
BEGIN
  RETURN QUERY SELECT * FROM coinsensei_get_jobs(p_job_type, p_status, 5);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_and_lock_job(TEXT, TEXT) TO authenticated, service_role;

CREATE FUNCTION get_pending_jobs_count(p_job_type TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN coinsensei_count_pending_jobs(p_job_type);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_pending_jobs_count(TEXT) TO authenticated, service_role;

CREATE FUNCTION mark_job_processing(p_job_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN coinsensei_start_job(p_job_id);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION mark_job_processing(TEXT) TO authenticated, service_role;

CREATE FUNCTION complete_job(
  p_job_id TEXT,
  p_result JSONB DEFAULT '{}'
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN coinsensei_complete_job(p_job_id, p_result);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION complete_job(TEXT, JSONB) TO authenticated, service_role;

CREATE FUNCTION fail_job(
  p_job_id TEXT,
  p_error_message TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN coinsensei_fail_job(p_job_id, p_error_message);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION fail_job(TEXT, TEXT) TO authenticated, service_role;

-- Add comments for documentation
COMMENT ON FUNCTION coinsensei_get_jobs(TEXT, TEXT, INTEGER) IS 'CoinSensei: Gets and locks available jobs for processing';
COMMENT ON FUNCTION coinsensei_count_pending_jobs(TEXT) IS 'CoinSensei: Returns count of pending jobs for a job type';
COMMENT ON FUNCTION coinsensei_start_job(TEXT) IS 'CoinSensei: Marks a job as processing with proper locking';
COMMENT ON FUNCTION coinsensei_complete_job(TEXT, JSONB) IS 'CoinSensei: Marks a job as completed with optional result data';
COMMENT ON FUNCTION coinsensei_fail_job(TEXT, TEXT) IS 'CoinSensei: Marks a job as failed and handles retry logic';

-- Add compatibility comments
COMMENT ON FUNCTION get_and_lock_job(TEXT, TEXT) IS 'Backward compatibility alias for coinsensei_get_jobs';
COMMENT ON FUNCTION get_pending_jobs_count(TEXT) IS 'Backward compatibility alias for coinsensei_count_pending_jobs';
COMMENT ON FUNCTION mark_job_processing(TEXT) IS 'Backward compatibility alias for coinsensei_start_job';
COMMENT ON FUNCTION complete_job(TEXT, JSONB) IS 'Backward compatibility alias for coinsensei_complete_job';
COMMENT ON FUNCTION fail_job(TEXT, TEXT) IS 'Backward compatibility alias for coinsensei_fail_job';

-- Show created functions
SELECT 
    schemaname,
    functionname,
    definition
FROM pg_functions 
WHERE functionname LIKE 'coinsensei_%' OR functionname IN ('get_and_lock_job', 'get_pending_jobs_count', 'mark_job_processing', 'complete_job', 'fail_job')
ORDER BY functionname; 