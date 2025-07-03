import { Queue, Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Create order processing queue
export const orderQueue = new Queue('order-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Create order processing worker
export const orderWorker = new Worker(
  'order-processing',
  async (job) => {
    const { orderId, type, amount, price, userId } = job.data;
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
      // Process the order based on type (buy/sell)
      if (type === 'buy') {
        // Lock PKR amount in user_pkr_wallets
        const { data: wallet, error: walletError } = await supabase
          .from('user_pkr_wallets')
          .select('balance')
          .eq('user_id', userId)
          .single();

        if (walletError) throw walletError;
        if (!wallet || wallet.balance < amount * price) {
          throw new Error('Insufficient PKR balance');
        }

        // Update wallet balance
        const { error: updateError } = await supabase
          .from('user_pkr_wallets')
          .update({ balance: wallet.balance - (amount * price) })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        // Add USDT to user_wallets
        const { error: usdtError } = await supabase
          .from('user_wallets')
          .update({ balance: amount })
          .eq('user_id', userId);

        if (usdtError) throw usdtError;

      } else if (type === 'sell') {
        // Lock USDT amount in user_wallets
        const { data: wallet, error: walletError } = await supabase
          .from('user_wallets')
          .select('balance')
          .eq('user_id', userId)
          .single();

        if (walletError) throw walletError;
        if (!wallet || wallet.balance < amount) {
          throw new Error('Insufficient USDT balance');
        }

        // Update wallet balance
        const { error: updateError } = await supabase
          .from('user_wallets')
          .update({ balance: wallet.balance - amount })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        // Add PKR to user_pkr_wallets
        const { error: pkrError } = await supabase
          .from('user_pkr_wallets')
          .update({ balance: amount * price })
          .eq('user_id', userId);

        if (pkrError) throw pkrError;
      }

      // Update order status to executed
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'executed',
          executed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      return { success: true };
    } catch (error) {
      // If there's an error, update order status to cancelled
      await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId);

      throw error;
    }
  },
  { connection }
);

// Handle worker events
orderWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

orderWorker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
}); 