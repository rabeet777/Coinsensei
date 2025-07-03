import PgBoss from 'pg-boss'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const dbUrl = process.env.SUPABASE_DB_URL
if (!dbUrl) {
  throw new Error('Missing SUPABASE_DB_URL in environment')
}

console.log('SUPABASE_DB_URL:', process.env.SUPABASE_DB_URL);

// Create pg-boss instance
export const boss = new PgBoss({
  connectionString: dbUrl,
  schema: 'pgboss',
  ssl: {
    rejectUnauthorized: false
  },
  // Optional: Configure job settings
  retentionDays: 7, // Keep job history for 7 days
  maintenanceIntervalMinutes: 10,
  // Optional: Configure worker settings
  monitorStateIntervalSeconds: 10
})

// Start the boss
boss.on('error', (error: Error) => console.error('Queue error:', error))
boss.on('stopped', () => console.log('Queue stopped'))

// Initialize the queue
await boss.start()

console.log('✅ Queue system initialized')

// Helper function to create a queue
export function createQueue<T extends object = object>(name: string) {
  return {
    async add(data: T, options: PgBoss.SendOptions = {}) {
      try {
        const result = await boss.send(name, data, options);
        console.log(`[pg-boss] send result for queue '${name}':`, result);
        return result;
      } catch (err) {
        console.error(`[pg-boss] send error for queue '${name}':`, err);
        throw err;
      }
    },
    async process(handler: (job: PgBoss.Job<T>) => Promise<void>) {
      // Type assertion to satisfy WorkHandler typing
      return boss.work(name, handler as any)
    },
    async getJobCounts() {
      const queues = await boss.getQueues()
      const queue = queues.find(q => q.name === name) as any
      if (!queue) {
        return {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0
        }
      }
      return {
        waiting: queue.waiting,
        active: queue.active,
        completed: queue.completed,
        failed: queue.failed,
        delayed: queue.delayed
      }
    }
  }
}

// Export common job options
export const defaultJobOptions: PgBoss.SendOptions = {
  retryLimit: 3,
  retryDelay: 30, // seconds
  retryBackoff: true
} 