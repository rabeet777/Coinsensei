// lib/queues.ts
import { Queue }       from 'bullmq';
import { redisConnection } from './redis';

// ✅ FIXED: Use consistent Redis connection configuration for all queues
export const withdrawalQueue = new Queue('withdrawal', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

export function addWithdrawalJob(data: any) {
  return withdrawalQueue.add('withdraw', data, {
    attempts: 3,
    backoff: { 
      type: 'exponential', 
      delay: 5000 
    },
    removeOnComplete: true,
    removeOnFail: false
  });
}

// Sync balances queue
export const syncBalancesQueue = new Queue('sync-balances', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
})

// Add sync balances job
export async function addSyncBalancesJob() {
  return syncBalancesQueue.add('sync', {}, {
    jobId: `sync-${Date.now()}`,
    removeOnComplete: true,
  })
}

// Consolidation queue
export const consolidationQueue = new Queue('consolidation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
})

// Add consolidation job
export async function addConsolidationJob() {
  return consolidationQueue.add('consolidate', {}, {
    jobId: `consolidate-${Date.now()}`,
    removeOnComplete: true,
  })
}

// Gas top-up queue
export const gasTopupQueue = new Queue('gas-topup', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true
  }
})

export async function addGasTopupJob() {
  const jobId = `topup-${Date.now()}`
  await gasTopupQueue.add('topup', {}, { jobId })
  return jobId
}

export const orderQueue = new Queue('order-matching', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
})

export function addOrderJob(orderId: string) {
  return orderQueue.add(
    'match-order',
    { orderId },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  )
}

// Get status of all queues
export async function getQueueStatus() {
  try {
    const [withdrawalStats, syncStats, consolidationStats, gasTopupStats, orderStats] = await Promise.all([
      withdrawalQueue.getJobCounts(),
      syncBalancesQueue.getJobCounts(),
      consolidationQueue.getJobCounts(),
      gasTopupQueue.getJobCounts(),
      orderQueue.getJobCounts(),
    ]);

    return {
      withdrawal: withdrawalStats,
      syncBalances: syncStats,
      consolidation: consolidationStats,
      gasTopup: gasTopupStats,
      orderMatching: orderStats,
    };
  } catch (error) {
    console.error('Error getting queue status:', error);
    throw error;
  }
}