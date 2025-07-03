import IORedis from 'ioredis'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const url = process.env.REDIS_URL
if (!url) {
  console.error('🚨 REDIS_URL is missing in .env.local')
  throw new Error('🚨 REDIS_URL env var is missing in .env.local')
}

// Ensure URL uses rediss:// for SSL
const redisUrl = url.startsWith('redis://') ? url.replace('redis://', 'rediss://') : url
console.log('🔗 [redis] connecting to Redis at', redisUrl)

// ✅ FIXED: Remove top-level await that was causing version errors
// Single IORedis instance for all queues & workers
export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false, // ✅ Disable to prevent blocking
  enableOfflineQueue: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    console.log(`Retrying Redis connection in ${delay}ms...`)
    return delay
  },
  tls: {
    rejectUnauthorized: false, // Required for Upstash Redis
    minVersion: 'TLSv1.2'     // Specify minimum TLS version
  },
  lazyConnect: true // ✅ Connect only when needed
})

redis.on('connect', () => {
  console.log('✅ [redis] Redis connected successfully')
})

redis.on('ready', () => {
  console.log('✅ [redis] Redis connection is ready for commands')
})

redis.on('error', (err) => {
  console.error('❌ [redis] Redis error:', err)
})

redis.on('close', () => {
  console.log('✅ [redis] Redis connection closed')
})

redis.on('reconnecting', () => {
  console.log('🔄 [redis] Redis reconnecting...')
})

// ✅ FIXED: Better Redis URL parsing for BullMQ
function parseRedisUrl(redisUrl: string) {
  try {
    const url = new URL(redisUrl)
    
    return {
      host: url.hostname,
      port: parseInt(url.port) || (url.protocol === 'rediss:' ? 6380 : 6379),
      username: url.username || undefined,
      password: url.password || undefined,
      db: url.pathname ? parseInt(url.pathname.slice(1)) || 0 : 0,
      tls: url.protocol === 'rediss:' ? {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2' as const
      } : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: true,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      }
    }
  } catch (error) {
    console.error('Failed to parse Redis URL:', error)
    // Fallback configuration
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: true,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      }
    }
  }
}

// ✅ Export properly parsed connection configuration for BullMQ
export const redisConnection = parseRedisUrl(redisUrl)

// Helper functions for common Redis operations
export const redisHelpers = {
  // Set a key with optional expiration
  async set(key: string, value: string, expireSeconds?: number): Promise<void> {
    if (expireSeconds) {
      await redis.set(key, value, 'EX', expireSeconds)
    } else {
      await redis.set(key, value)
    }
  },

  // Get a key
  async get(key: string): Promise<string | null> {
    return await redis.get(key)
  },

  // Delete a key
  async del(key: string): Promise<void> {
    await redis.del(key)
  },

  // Set a hash field
  async hset(key: string, field: string, value: string): Promise<void> {
    await redis.hset(key, field, value)
  },

  // Get a hash field
  async hget(key: string, field: string): Promise<string | null> {
    return await redis.hget(key, field)
  },

  // Get all hash fields
  async hgetall(key: string): Promise<Record<string, string>> {
    return await redis.hgetall(key)
  },

  // Delete a hash field
  async hdel(key: string, field: string): Promise<void> {
    await redis.hdel(key, field)
  },

  // Add to a set
  async sadd(key: string, ...members: string[]): Promise<void> {
    await redis.sadd(key, ...members)
  },

  // Get all members of a set
  async smembers(key: string): Promise<string[]> {
    return await redis.smembers(key)
  },

  // Remove from a set
  async srem(key: string, ...members: string[]): Promise<void> {
    await redis.srem(key, ...members)
  }
} 