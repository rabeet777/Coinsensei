import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, flags } = body;

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'wallet_address is required' },
        { status: 400 }
      );
    }

    if (!flags || typeof flags !== 'object') {
      return NextResponse.json(
        { error: 'flags object is required' },
        { status: 400 }
      );
    }

    // Validate flags
    const allowedFlags = ['needs_consolidation', 'needs_gas'];
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    for (const [key, value] of Object.entries(flags)) {
      if (!allowedFlags.includes(key)) {
        return NextResponse.json(
          { error: `Invalid flag: ${key}` },
          { status: 400 }
        );
      }
      
      if (typeof value !== 'boolean') {
        return NextResponse.json(
          { error: `Flag ${key} must be a boolean` },
          { status: 400 }
        );
      }
      
      updateData[key] = value;
    }

    // Update wallet flags
    const { data, error } = await supabase
      .from('user_wallets')
      .update(updateData)
      .eq('address', wallet_address)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update wallet flags' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      wallet: data[0],
      message: 'Wallet flags updated successfully'
    });

  } catch (error) {
    console.error('Error updating wallet flags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 