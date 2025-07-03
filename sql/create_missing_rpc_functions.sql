-- Create missing RPC functions for workers
-- These functions were referenced in workers but didn't exist

-- Drop ALL existing function variants to avoid conflicts
DROP FUNCTION IF EXISTS get_and_lock_job CASCADE;
DROP FUNCTION IF EXISTS get_and_lock_job(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_and_lock_job(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_and_lock_job(TEXT, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_pending_jobs_count CASCADE;
DROP FUNCTION IF EXISTS get_pending_jobs_count(TEXT) CASCADE;
DROP FUNCTION IF EXISTS mark_job_processing CASCADE;
DROP FUNCTION IF EXISTS mark_job_processing(TEXT) CASCADE;
DROP FUNCTION IF EXISTS complete_job CASCADE;
DROP FUNCTION IF EXISTS complete_job(TEXT) CASCADE;
DROP FUNCTION IF EXISTS complete_job(TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS fail_job CASCADE;
DROP FUNCTION IF EXISTS fail_job(TEXT, TEXT) CASCADE;

-- 1. Create get_and_lock_job function for workers (with unique name)
CREATE FUNCTION worker_get_and_lock_job(
  p_job_type TEXT,
  p_status TEXT DEFAULT 'pending'
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
  LIMIT 5
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION worker_get_and_lock_job(TEXT, TEXT) TO authenticated, service_role;

-- Create alias with original name for backward compatibility
CREATE FUNCTION get_and_lock_job(
  p_job_type TEXT,
  p_status TEXT DEFAULT 'pending'  
) RETURNS SETOF job_logs AS $$
BEGIN
  RETURN QUERY SELECT * FROM worker_get_and_lock_job(p_job_type, p_status);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission for alias
GRANT EXECUTE ON FUNCTION get_and_lock_job(TEXT, TEXT) TO authenticated, service_role;

-- 2. Create helper function to safely get job types 
CREATE FUNCTION get_pending_jobs_count(p_job_type TEXT)
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
GRANT EXECUTE ON FUNCTION get_pending_jobs_count(TEXT) TO authenticated, service_role;

-- 3. Create function to mark job as processing with lock
CREATE FUNCTION mark_job_processing(p_job_id TEXT)
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
  
  -- FOUND is automatically set by PostgreSQL after DML operations
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_job_processing(TEXT) TO authenticated, service_role;

-- 4. Create function to complete a job
CREATE FUNCTION complete_job(
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
  
  -- FOUND is automatically set by PostgreSQL after DML operations
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION complete_job(TEXT, JSONB) TO authenticated, service_role;

-- 5. Create function to fail a job
CREATE FUNCTION fail_job(
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
  
  -- FOUND is automatically set by PostgreSQL after DML operations
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION fail_job(TEXT, TEXT) TO authenticated, service_role;

-- Add comments for documentation
COMMENT ON FUNCTION worker_get_and_lock_job(TEXT, TEXT) IS 'Gets and locks available jobs for processing (primary implementation)';
COMMENT ON FUNCTION get_and_lock_job(TEXT, TEXT) IS 'Gets and locks available jobs for processing (backward compatibility alias)';
COMMENT ON FUNCTION get_pending_jobs_count(TEXT) IS 'Returns count of pending jobs for a job type';
COMMENT ON FUNCTION mark_job_processing(TEXT) IS 'Marks a job as processing with proper locking';
COMMENT ON FUNCTION complete_job(TEXT, JSONB) IS 'Marks a job as completed with optional result data';
COMMENT ON FUNCTION fail_job(TEXT, TEXT) IS 'Marks a job as failed and handles retry logic'; 