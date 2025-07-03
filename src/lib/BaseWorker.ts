import { createClient } from '@supabase/supabase-js'
import * as os from 'os'

// Base worker class that all workers extend
export abstract class BaseWorker {
  abstract workerId: string
  abstract workerType: string
  abstract blockchain: string
  
  protected isRunning = false
  protected heartbeatInterval: NodeJS.Timeout | null = null
  protected supabaseAdmin: any
  
  constructor() {
    this.supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  
  // Start the worker
  async start() {
    try {
      this.isRunning = true
      await this.registerWorker()
      this.startHeartbeat()
      await this.processJobs()
      console.log(`✅ Worker ${this.workerId} started successfully`)
    } catch (error) {
      console.error(`❌ Failed to start worker ${this.workerId}:`, error)
      await this.reportError(error)
      throw error
    }
  }
  
  // Stop the worker gracefully
  async stop() {
    try {
      this.isRunning = false
      this.stopHeartbeat()
      await this.updateWorkerStatus('stopped')
      console.log(`🛑 Worker ${this.workerId} stopped`)
    } catch (error) {
      console.error(`❌ Error stopping worker ${this.workerId}:`, error)
    }
  }
  
  // Register worker in the registry
  private async registerWorker() {
    await this.supabaseAdmin.from('worker_registry').upsert({
      id: this.workerId,
      name: `${this.blockchain}-${this.workerType}`,
      type: this.workerType,
      blockchain: this.blockchain,
      status: 'running',
      pid: process.pid,
      host: os.hostname(),
      port: process.env.PORT || null,
      last_heartbeat: new Date().toISOString(),
      config: this.getWorkerConfig(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  // Start sending heartbeats
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.supabaseAdmin
          .from('worker_registry')
          .update({ 
            last_heartbeat: new Date().toISOString(),
            status: 'running',
            updated_at: new Date().toISOString()
          })
          .eq('id', this.workerId)
      } catch (error) {
        console.error('Heartbeat failed:', error)
      }
    }, 30000) // 30 seconds
  }
  
  // Stop heartbeat
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
  
  // Update worker status
  protected async updateWorkerStatus(status: string, errorMessage?: string) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }
    
    if (errorMessage) {
      updateData.last_error = errorMessage
    }
    
    await this.supabaseAdmin
      .from('worker_registry')
      .update(updateData)
      .eq('id', this.workerId)
  }
  
  // Report error
  protected async reportError(error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`🚨 Worker ${this.workerId} error:`, errorMessage)
    
    await this.updateWorkerStatus('error', errorMessage)
    
    // Could also send to external monitoring service here
    // await this.sendToMonitoring('worker_error', { workerId: this.workerId, error: errorMessage })
  }
  
  // Get worker configuration
  protected getWorkerConfig() {
    return {
      pollInterval: this.getPollInterval(),
      maxConcurrency: this.getMaxConcurrency(),
      retryAttempts: this.getRetryAttempts(),
      version: process.env.npm_package_version || '1.0.0'
    }
  }
  
  // Abstract methods that must be implemented by subclasses
  abstract processJobs(): Promise<void>
  
  // Optional methods with default implementations
  protected getPollInterval(): number {
    return 10000 // 10 seconds
  }
  
  protected getMaxConcurrency(): number {
    return 3
  }
  
  protected getRetryAttempts(): number {
    return 3
  }
  
  // Graceful shutdown handling
  setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      console.log(`📡 Received ${signal}, shutting down worker ${this.workerId}...`)
      await this.stop()
      process.exit(0)
    }
    
    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGUSR2', () => shutdown('SIGUSR2')) // Nodemon restart
  }
}

// Worker status types
export interface WorkerStatus {
  id: string
  name: string
  type: string
  blockchain: string
  status: 'running' | 'stopped' | 'error' | 'maintenance'
  pid?: number
  host?: string
  port?: number
  last_heartbeat: string
  last_error?: string
  config: {
    pollInterval: number
    maxConcurrency: number
    retryAttempts: number
    version: string
  }
  created_at: string
  updated_at: string
}

// Health check interface
export interface HealthCheck {
  name: string
  passed: boolean
  value: any
  threshold?: any
  message: string
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'unhealthy' | 'unknown'
  reason?: string
  issues?: HealthCheck[]
} 