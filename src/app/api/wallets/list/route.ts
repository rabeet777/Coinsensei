import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Wallets API called');
    const { searchParams } = new URL(request.url);
    
    // Check if this is a summary request for dashboard
    const summaryOnly = searchParams.get('summary') === 'true';
    
    // Extract filter parameters
    const needs_consolidation = searchParams.get('needs_consolidation');
    const needs_gas = searchParams.get('needs_gas');
    const min_balance = searchParams.get('min_balance');
    const max_balance = searchParams.get('max_balance');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🔍 Query filters:', { needs_consolidation, needs_gas, min_balance, max_balance, limit, offset, summaryOnly });

    // Get summary statistics for dashboard
    if (summaryOnly) {
      const { data: allWallets, error: summaryError } = await supabase
        .from('user_wallets')
        .select('on_chain_balance, trx_balance, needs_consolidation, needs_gas, created_at');

      if (summaryError) {
        console.error('❌ Error fetching wallet summary:', summaryError);
        return NextResponse.json(
          { error: 'Failed to fetch wallet summary' },
          { status: 500 }
        );
      }

      const summary = {
        total: allWallets?.length || 0,
        active_wallets: allWallets?.filter(w => (w.on_chain_balance || 0) > 0 || (w.trx_balance || 0) > 0).length || 0,
        needs_consolidation: allWallets?.filter(w => w.needs_consolidation).length || 0,
        needs_gas: allWallets?.filter(w => w.needs_gas).length || 0,
        total_usdt_balance: allWallets?.reduce((sum, w) => sum + (w.on_chain_balance || 0), 0) || 0,
        total_trx_balance: allWallets?.reduce((sum, w) => sum + (w.trx_balance || 0), 0) || 0,
        new_wallets_today: allWallets?.filter(w => {
          const created = new Date(w.created_at);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return created >= today;
        }).length || 0,
        last_updated: new Date().toISOString()
      };

      console.log('📈 Wallet summary:', summary);
      return NextResponse.json(summary);
    }

    let query = supabase
      .from('user_wallets')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters (only for columns that exist)
    if (needs_consolidation !== null && needs_consolidation !== '') {
      console.log('🚩 Applying needs_consolidation filter:', needs_consolidation);
      query = query.eq('needs_consolidation', needs_consolidation === 'true');
    }
    
    if (needs_gas !== null && needs_gas !== '') {
      console.log('⛽ Applying needs_gas filter:', needs_gas);
      query = query.eq('needs_gas', needs_gas === 'true');
    }
    
    if (min_balance) {
      console.log('💰 Applying min_balance filter:', min_balance);
      query = query.gte('on_chain_balance', parseFloat(min_balance));
    }
    
    if (max_balance) {
      console.log('💸 Applying max_balance filter:', max_balance);
      query = query.lte('on_chain_balance', parseFloat(max_balance));
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    console.log('🔄 Executing Supabase query...');
    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch wallets', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Query successful! Fetched ${data?.length || 0} wallets from user_wallets table`);
    console.log('📊 First wallet (if any):', data?.[0]);

    return NextResponse.json({
      wallets: data || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('💥 Unexpected error fetching wallets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 