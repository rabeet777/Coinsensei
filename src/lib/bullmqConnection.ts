import dotenv from 'dotenv'
import IORedis from 'ioredis'
dotenv.config({ path: '.env.local' })

const url = process.env.REDIS_URL
if (!url) {
  throw new Error('🚨 REDIS_URL env var is missing in .env.local')
}

// Ensure URL uses rediss:// for SSL
const redisUrl = url.startsWith('redis://') ? url.replace('redis://', 'rediss://') : url
console.log('🔗 [bullmqConnection] connecting to Redis at', redisUrl)

// Single IORedis instance for all queues & workers
export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    console.log(`Retrying Redis connection in ${delay}ms...`)
    return delay
  },
  tls: {
    rejectUnauthorized: false, // Required for Upstash Redis
    minVersion: 'TLSv1.2'     // Specify minimum TLS version
  }
})

redis.on('connect', () => {
  console.log('✅ [bullmqConnection] Redis connected')
})

redis.on('ready', () => {
  console.log('✅ [bullmqConnection] Redis connection is ready')
})

redis.on('error', (err) => {
  console.error('❌ [bullmqConnection] Redis error:', err)
})

redis.on('close', () => {
  console.log('✅ [bullmqConnection] Redis connection closed')
})

// Wait for Redis to be ready
await new Promise((resolve) => {
  if (redis.status === 'ready') {
    resolve(true)
  } else {
    redis.once('ready', () => resolve(true))
  }
})

console.log('Redis connection established and ready')

export const connection = new IORedis(url)