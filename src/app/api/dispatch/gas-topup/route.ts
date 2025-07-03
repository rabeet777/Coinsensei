import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, user_id, priority = 5, triggered_by = 'manual' } = body;

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'wallet_address is required' },
        { status: 400 }
      );
    }

    // Create job entry in database
    const jobData = {
      job_id: `gas-topup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      job_type: 'gas-topup',
      status: 'pending',
      wallet_address,
      user_id,
      triggered_by,
      data: {
        wallet_address,
        user_id,
        priority,
        created_at: new Date().toISOString()
      },
      retry_count: 0,
      max_retries: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('job_logs')
      .insert([jobData])
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create job record' },
        { status: 500 }
      );
    }

    // Here you would typically add the job to your BullMQ queue
    // Example:
    // await gasTopupQueue.add('gas-topup', jobData, { priority });

    return NextResponse.json({
      success: true,
      job: data[0],
      message: 'Gas top-up job queued successfully'
    });

  } catch (error) {
    console.error('Error dispatching gas top-up job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}