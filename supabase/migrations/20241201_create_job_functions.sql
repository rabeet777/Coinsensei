-- Create function to get and lock jobs with FOR UPDATE SKIP LOCKED functionality
CREATE OR REPLACE FUNCTION get_and_lock_job(
  p_job_type TEXT,
  p_status TEXT DEFAULT 'pending',
  p_limit INTEGER DEFAULT 1
)
RETURNS SETOF job_logs
LANGUAGE plpgsql
AS $$
DECLARE
  job_record job_logs%rowtype;
BEGIN
  FOR job_record IN
    SELECT *
    FROM job_logs
    WHERE job_type = p_job_type
      AND status = p_status
      AND retry_count < max_retries
    ORDER BY created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  LOOP
    RETURN NEXT job_record;
  END LOOP;
END;
$$;

-- Create function to cleanup stuck jobs (alternative to cron)
CREATE OR REPLACE FUNCTION cleanup_stuck_jobs(
  p_threshold_minutes INTEGER DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  cutoff_time TIMESTAMPTZ;
  stuck_count INTEGER;
  updated_count INTEGER;
  result JSON;
BEGIN
  -- Calculate cutoff time
  cutoff_time := NOW() - (p_threshold_minutes || ' minutes')::INTERVAL;
  
  -- Count stuck jobs
  SELECT COUNT(*) INTO stuck_count
  FROM job_logs
  WHERE status = 'active'
    AND started_at < cutoff_time;
  
  -- Update stuck jobs to failed
  UPDATE job_logs
  SET 
    status = 'failed',
    error_message = 'Job stuck in active state for more than ' || p_threshold_minutes || ' minutes. Marked as failed by cleanup process.',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE status = 'active'
    AND started_at < cutoff_time;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Create result
  result := json_build_object(
    'stuck_jobs_found', stuck_count,
    'jobs_cleaned', updated_count,
    'cutoff_time', cutoff_time,
    'threshold_minutes', p_threshold_minutes
  );
  
  RETURN result;
END;
$$;

-- Create function to get job queue statistics
CREATE OR REPLACE FUNCTION get_job_queue_stats()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'pending_jobs', COALESCE(pending.count, 0),
    'active_jobs', COALESCE(active.count, 0),
    'completed_jobs_today', COALESCE(completed.count, 0),
    'failed_jobs_today', COALESCE(failed.count, 0),
    'by_type', COALESCE(by_type.stats, '[]'::json)
  ) INTO result
  FROM 
    (SELECT COUNT(*) as count FROM job_logs WHERE status = 'pending') pending,
    (SELECT COUNT(*) as count FROM job_logs WHERE status = 'active') active,
    (SELECT COUNT(*) as count FROM job_logs WHERE status = 'completed' AND created_at >= CURRENT_DATE) completed,
    (SELECT COUNT(*) as count FROM job_logs WHERE status = 'failed' AND created_at >= CURRENT_DATE) failed,
    (
      SELECT json_agg(
        json_build_object(
          'job_type', job_type,
          'pending', pending_count,
          'active', active_count,
          'completed_today', completed_count,
          'failed_today', failed_count
        )
      ) as stats
      FROM (
        SELECT 
          job_type,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
          COUNT(*) FILTER (WHERE status = 'active') as active_count,
          COUNT(*) FILTER (WHERE status = 'completed' AND created_at >= CURRENT_DATE) as completed_count,
          COUNT(*) FILTER (WHERE status = 'failed' AND created_at >= CURRENT_DATE) as failed_count
        FROM job_logs
        GROUP BY job_type
      ) stats_by_type
    ) by_type;
  
  RETURN result;
END;
$$;

-- Create function to retry failed jobs
CREATE OR REPLACE FUNCTION retry_failed_jobs(
  p_job_type TEXT DEFAULT NULL,
  p_max_age_hours INTEGER DEFAULT 24
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER;
  cutoff_time TIMESTAMPTZ;
BEGIN
  cutoff_time := NOW() - (p_max_age_hours || ' hours')::INTERVAL;
  
  UPDATE job_logs
  SET 
    status = 'pending',
    error_message = NULL,
    started_at = NULL,
    completed_at = NULL,
    updated_at = NOW()
  WHERE status = 'failed'
    AND retry_count < max_retries
    AND created_at >= cutoff_time
    AND (p_job_type IS NULL OR job_type = p_job_type);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

-- Grant execute permissions to the service role
GRANT EXECUTE ON FUNCTION get_and_lock_job(TEXT, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_stuck_jobs(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_job_queue_stats() TO service_role;
GRANT EXECUTE ON FUNCTION retry_failed_jobs(TEXT, INTEGER) TO service_role;

-- Add comments
COMMENT ON FUNCTION get_and_lock_job(TEXT, TEXT, INTEGER) IS 'Gets and locks jobs using FOR UPDATE SKIP LOCKED to prevent race conditions';
COMMENT ON FUNCTION cleanup_stuck_jobs(INTEGER) IS 'Marks jobs stuck in active state as failed after specified minutes';
COMMENT ON FUNCTION get_job_queue_stats() IS 'Returns statistics about job queue status';
COMMENT ON FUNCTION retry_failed_jobs(TEXT, INTEGER) IS 'Retries failed jobs that haven not exceeded max retries'; 