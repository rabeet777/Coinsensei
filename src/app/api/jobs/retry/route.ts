import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, reset_retry_count = false } = body;

    if (!job_id) {
      return NextResponse.json(
        { error: 'job_id is required' },
        { status: 400 }
      );
    }

    // First, get the current job
    const { data: currentJob, error: fetchError } = await supabase
      .from('job_logs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (fetchError || !currentJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if job can be retried
    if (currentJob.status !== 'failed') {
      return NextResponse.json(
        { error: 'Only failed jobs can be retried' },
        { status: 400 }
      );
    }

    // Calculate new retry count
    const newRetryCount = reset_retry_count ? 0 : currentJob.retry_count;

    // Check if retries are exhausted (unless reset)
    if (!reset_retry_count && newRetryCount >= currentJob.max_retries) {
      return NextResponse.json(
        { error: 'Maximum retries exceeded' },
        { status: 400 }
      );
    }

    // Update job status and retry count
    const updateData = {
      status: 'pending',
      retry_count: newRetryCount,
      error_message: null,
      started_at: null,
      completed_at: null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('job_logs')
      .update(updateData)
      .eq('id', job_id)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update job' },
        { status: 500 }
      );
    }

    // Here you would typically re-add the job to your BullMQ queue
    // Example based on job type:
    // switch (currentJob.job_type) {
    //   case 'gas-topup':
    //     await gasTopupQueue.add('gas-topup', currentJob.data);
    //     break;
    //   case 'consolidation':
    //     await consolidationQueue.add('consolidation', currentJob.data);
    //     break;
    //   case 'sync':
    //     await syncQueue.add('sync', currentJob.data);
    //     break;
    // }

    return NextResponse.json({
      success: true,
      job: data[0],
      message: `Job retry queued successfully${reset_retry_count ? ' with reset retry count' : ''}`
    });

  } catch (error) {
    console.error('Error retrying job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 