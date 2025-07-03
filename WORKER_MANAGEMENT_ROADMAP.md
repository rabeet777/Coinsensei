# 🚀 CoinSensei Worker Management Roadmap
## Professional Exchange-Level Architecture

### 📋 Table of Contents
- [Current State](#current-state)
- [Phase 1: Worker Registry](#phase-1-worker-registry)
- [Phase 2: Admin Controls](#phase-2-admin-controls) 
- [Phase 3: Multi-Blockchain](#phase-3-multi-blockchain)
- [Phase 4: Scaling](#phase-4-scaling)
- [Phase 5: Production](#phase-5-production)

---

## 🔍 Current State

### ✅ What's Working
- Withdrawal worker for TRON USDT
- Simple database queue system
- Basic error handling & retries
- Supabase integration with RLS

### ⚠️ Needs Improvement
- No centralized worker management
- No admin controls (start/stop/restart)
- Single blockchain support only
- Basic polling mechanism
- Limited monitoring & alerting
- Manual scaling only

---

## 🏗️ Phase 1: Worker Registry System (Weeks 1-2)

### 1.1 Database Schema
```sql
-- Create worker registry table
CREATE TABLE worker_registry (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'withdrawal', 'deposit', 'consolidation'
  blockchain VARCHAR(20) NOT NULL, -- 'tron', 'ethereum', 'bitcoin'
  status VARCHAR(20) DEFAULT 'stopped', -- 'running', 'stopped', 'error'
  pid INTEGER,
  host VARCHAR(100),
  port INTEGER,
  last_heartbeat TIMESTAMPTZ,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 Worker Base Class
```typescript
// src/lib/BaseWorker.ts
abstract class BaseWorker {
  abstract workerId: string
  abstract workerType: string
  abstract blockchain: string
  
  protected isRunning = false
  protected heartbeatInterval: NodeJS.Timeout | null = null
  
  async start() {
    this.isRunning = true
    await this.registerWorker()
    this.startHeartbeat()
    console.log(`Worker ${this.workerId} started`)
  }
  
  async stop() {
    this.isRunning = false
    this.stopHeartbeat()
    await this.unregisterWorker()
    console.log(`Worker ${this.workerId} stopped`)
  }
  
  private async registerWorker() {
    await supabaseAdmin.from('worker_registry').upsert({
      id: this.workerId,
      name: this.workerType,
      type: this.workerType,
      blockchain: this.blockchain,
      status: 'running',
      pid: process.pid,
      host: os.hostname(),
      last_heartbeat: new Date().toISOString()
    })
  }
  
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      await supabaseAdmin
        .from('worker_registry')
        .update({ 
          last_heartbeat: new Date().toISOString(),
          status: 'running' 
        })
        .eq('id', this.workerId)
    }, 30000) // 30 seconds
  }
  
  abstract processJobs(): Promise<void>
}
```

### 1.3 Enhanced Withdrawal Worker
```typescript
// src/workers/withdrawal-enhanced.ts
class TronWithdrawalWorker extends BaseWorker {
  workerId = 'tron-withdrawal-001'
  workerType = 'withdrawal'
  blockchain = 'tron'
  
  async processJobs() {
    while (this.isRunning) {
      try {
        const jobs = await getPendingWithdrawalJobs(3)
        for (const job of jobs) {
          await this.processWithdrawal(job)
        }
        await new Promise(resolve => setTimeout(resolve, 10000))
      } catch (error) {
        console.error('Error in job processing:', error)
        await this.reportError(error)
      }
    }
  }
  
  private async reportError(error: any) {
    await supabaseAdmin
      .from('worker_registry')
      .update({ 
        status: 'error',
        last_error: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', this.workerId)
  }
}
```

---

## 🎛️ Phase 2: Admin Control System (Weeks 3-4)

### 2.1 Worker Management API
```typescript
// src/app/api/admin/workers/route.ts
export async function GET() {
  const { data: workers } = await supabaseAdmin
    .from('worker_registry')
    .select('*')
    .order('created_at', { ascending: false })
  
  return NextResponse.json({ workers })
}

// src/app/api/admin/workers/[id]/start/route.ts
export async function POST(req: NextRequest, { params }: { params: { id: string }}) {
  const workerId = params.id
  
  try {
    // Send start signal to worker
    await publishWorkerCommand(workerId, 'start')
    
    return NextResponse.json({ 
      message: `Start signal sent to worker ${workerId}` 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to start worker' 
    }, { status: 500 })
  }
}
```

### 2.2 Admin Dashboard Component
```typescript
// src/components/admin/WorkerManagement.tsx
export default function WorkerManagement() {
  const [workers, setWorkers] = useState<Worker[]>([])
  
  const startWorker = async (workerId: string) => {
    await fetch(`/api/admin/workers/${workerId}/start`, { method: 'POST' })
    refreshWorkers()
  }
  
  const stopWorker = async (workerId: string) => {
    await fetch(`/api/admin/workers/${workerId}/stop`, { method: 'POST' })
    refreshWorkers()
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Worker Management</h2>
      
      <div className="grid gap-4">
        {workers.map(worker => (
          <div key={worker.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{worker.name}</h3>
                <p className="text-sm text-gray-600">
                  {worker.blockchain} • {worker.type}
                </p>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={worker.status} />
                  <span className="text-xs">
                    Last seen: {formatDistanceToNow(new Date(worker.last_heartbeat))} ago
                  </span>
                </div>
              </div>
              
              <div className="space-x-2">
                <Button 
                  onClick={() => startWorker(worker.id)}
                  disabled={worker.status === 'running'}
                  variant="outline"
                  size="sm"
                >
                  Start
                </Button>
                <Button 
                  onClick={() => stopWorker(worker.id)}
                  disabled={worker.status === 'stopped'}
                  variant="outline"
                  size="sm"
                >
                  Stop
                </Button>
                <Button 
                  onClick={() => restartWorker(worker.id)}
                  variant="outline" 
                  size="sm"
                >
                  Restart
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 2.3 Real-time Status Updates
```typescript
// src/hooks/useWorkerStatus.ts
export function useWorkerStatus() {
  const [workers, setWorkers] = useState<Worker[]>([])
  
  useEffect(() => {
    const supabase = createClientComponentClient()
    
    // Subscribe to worker registry changes
    const subscription = supabase
      .channel('worker_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'worker_registry'
      }, (payload) => {
        // Update worker status in real-time
        setWorkers(prev => 
          prev.map(w => 
            w.id === payload.new.id ? { ...w, ...payload.new } : w
          )
        )
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [])
  
  return { workers, refreshWorkers }
}
```

---

## 🌐 Phase 3: Multi-Blockchain Support (Weeks 5-7)

### 3.1 Blockchain Provider Interface
```typescript
// src/lib/blockchain/Provider.ts
interface BlockchainProvider {
  network: string
  nativeToken: string
  
  // Wallet operations
  createWallet(index: number): Promise<Wallet>
  getBalance(address: string, token?: string): Promise<number>
  
  // Transaction operations
  sendTransaction(params: SendTransactionParams): Promise<Transaction>
  getTransaction(txId: string): Promise<Transaction>
  estimateFee(params: FeeEstimationParams): Promise<number>
  
  // Contract operations (for tokens)
  getTokenBalance?(address: string, tokenContract: string): Promise<number>
  sendToken?(params: SendTokenParams): Promise<Transaction>
}

interface SendTransactionParams {
  from: string
  to: string
  amount: number
  privateKey: string
  memo?: string
}
```

### 3.2 Provider Implementations
```typescript
// src/lib/blockchain/providers/TronProvider.ts
export class TronProvider implements BlockchainProvider {
  network = 'tron'
  nativeToken = 'TRX'
  
  async sendTransaction(params: SendTransactionParams): Promise<Transaction> {
    const tronWeb = new TronWeb({
      fullHost: process.env.TRON_FULL_HOST,
      headers: { 'TRON-PRO-API-KEY': process.env.TRON_API_KEY }
    })
    
    tronWeb.setPrivateKey(params.privateKey)
    
    const transaction = await tronWeb.trx.sendTransaction(
      params.to,
      tronWeb.toSun(params.amount)
    )
    
    return {
      hash: transaction.txid,
      from: params.from,
      to: params.to,
      amount: params.amount,
      status: 'pending',
      timestamp: new Date()
    }
  }
  
  async sendToken(params: SendTokenParams): Promise<Transaction> {
    const tronWeb = new TronWeb({
      fullHost: process.env.TRON_FULL_HOST,
      headers: { 'TRON-PRO-API-KEY': process.env.TRON_API_KEY }
    })
    
    tronWeb.setPrivateKey(params.privateKey)
    
    const contract = await tronWeb.contract().at(params.tokenContract)
    const result = await contract.transfer(
      params.to,
      Math.floor(params.amount * Math.pow(10, params.decimals))
    ).send()
    
    return {
      hash: result,
      from: params.from,
      to: params.to,
      amount: params.amount,
      token: params.tokenContract,
      status: 'pending',
      timestamp: new Date()
    }
  }
}

// src/lib/blockchain/providers/EthereumProvider.ts
export class EthereumProvider implements BlockchainProvider {
  network = 'ethereum'
  nativeToken = 'ETH'
  
  async sendTransaction(params: SendTransactionParams): Promise<Transaction> {
    // Ethereum implementation using ethers.js
  }
  
  async sendToken(params: SendTokenParams): Promise<Transaction> {
    // ERC20 token transfer implementation
  }
}
```

### 3.3 Worker Factory Pattern
```typescript
// src/lib/WorkerFactory.ts
class WorkerFactory {
  private providers = new Map<string, BlockchainProvider>()
  
  constructor() {
    this.providers.set('tron', new TronProvider())
    this.providers.set('ethereum', new EthereumProvider())
    this.providers.set('bitcoin', new BitcoinProvider())
  }
  
  createWithdrawalWorker(blockchain: string, workerId: string): BaseWorker {
    const provider = this.providers.get(blockchain)
    if (!provider) {
      throw new Error(`Unsupported blockchain: ${blockchain}`)
    }
    
    return new WithdrawalWorker(workerId, blockchain, provider)
  }
  
  createDepositWorker(blockchain: string, workerId: string): BaseWorker {
    const provider = this.providers.get(blockchain)
    if (!provider) {
      throw new Error(`Unsupported blockchain: ${blockchain}`)
    }
    
    return new DepositWorker(workerId, blockchain, provider)
  }
}
```

---

## 📈 Phase 4: Scaling & Performance (Weeks 8-10)

### 4.1 Redis Job Queue
```typescript
// src/lib/RedisJobQueue.ts
import { Queue, Worker, Job } from 'bullmq'

export class RedisJobQueue {
  private queues = new Map<string, Queue>()
  private workers = new Map<string, Worker>()
  
  createQueue(name: string, options?: any) {
    const queue = new Queue(name, {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT!),
      },
      ...options
    })
    
    this.queues.set(name, queue)
    return queue
  }
  
  createWorker(queueName: string, processor: any) {
    const worker = new Worker(queueName, processor, {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT!),
      },
      concurrency: 5,
      removeOnComplete: 100,
      removeOnFail: 50
    })
    
    this.workers.set(queueName, worker)
    return worker
  }
  
  async addJob(queueName: string, jobData: any, options?: any) {
    const queue = this.queues.get(queueName)
    if (!queue) throw new Error(`Queue ${queueName} not found`)
    
    return await queue.add('process', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      ...options
    })
  }
}
```

### 4.2 Auto-scaling Logic
```typescript
// src/lib/AutoScaler.ts
export class WorkerAutoScaler {
  private scalingConfig = {
    minWorkers: 1,
    maxWorkers: 10,
    scaleUpThreshold: 50,    // Queue depth
    scaleDownThreshold: 5,   // Queue depth
    cooldownPeriod: 300000   // 5 minutes
  }
  
  async evaluateScaling(queueName: string): Promise<ScalingAction> {
    const queueDepth = await this.getQueueDepth(queueName)
    const activeWorkers = await this.getActiveWorkers(queueName)
    const lastScaling = await this.getLastScalingTime(queueName)
    
    // Check cooldown period
    if (Date.now() - lastScaling < this.scalingConfig.cooldownPeriod) {
      return { action: 'none', reason: 'cooldown' }
    }
    
    // Scale up if queue is growing
    if (queueDepth > this.scalingConfig.scaleUpThreshold && 
        activeWorkers < this.scalingConfig.maxWorkers) {
      return { 
        action: 'scale-up', 
        count: Math.min(2, this.scalingConfig.maxWorkers - activeWorkers),
        reason: `Queue depth: ${queueDepth}` 
      }
    }
    
    // Scale down if queue is empty
    if (queueDepth < this.scalingConfig.scaleDownThreshold && 
        activeWorkers > this.scalingConfig.minWorkers) {
      return { 
        action: 'scale-down', 
        count: 1,
        reason: `Low queue depth: ${queueDepth}` 
      }
    }
    
    return { action: 'none', reason: 'no scaling needed' }
  }
}
```

---

## 🚀 Phase 5: Production Ready (Weeks 11-12)

### 5.1 Health Checks & Monitoring
```typescript
// src/lib/HealthChecker.ts
export class WorkerHealthChecker {
  async checkWorkerHealth(workerId: string): Promise<HealthStatus> {
    const worker = await this.getWorker(workerId)
    if (!worker) return { status: 'unknown', reason: 'Worker not found' }
    
    const checks = await Promise.all([
      this.checkHeartbeat(worker),
      this.checkMemoryUsage(worker),
      this.checkJobProcessing(worker),
      this.checkErrorRate(worker)
    ])
    
    const failedChecks = checks.filter(check => !check.passed)
    
    if (failedChecks.length === 0) {
      return { status: 'healthy' }
    } else if (failedChecks.length === 1) {
      return { status: 'warning', issues: failedChecks }
    } else {
      return { status: 'unhealthy', issues: failedChecks }
    }
  }
  
  private async checkHeartbeat(worker: Worker): Promise<HealthCheck> {
    const timeSinceHeartbeat = Date.now() - new Date(worker.last_heartbeat).getTime()
    const threshold = 60000 // 1 minute
    
    return {
      name: 'heartbeat',
      passed: timeSinceHeartbeat < threshold,
      value: timeSinceHeartbeat,
      threshold,
      message: timeSinceHeartbeat < threshold ? 'OK' : 'Stale heartbeat'
    }
  }
}
```

### 5.2 Production Deployment
```yaml
# docker-compose.production.yml
version: '3.8'
services:
  withdrawal-worker-tron:
    image: coinsensei/worker:latest
    environment:
      - WORKER_TYPE=withdrawal
      - BLOCKCHAIN=tron
      - NODE_ENV=production
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    
  withdrawal-worker-ethereum:
    image: coinsensei/worker:latest
    environment:
      - WORKER_TYPE=withdrawal
      - BLOCKCHAIN=ethereum
      - NODE_ENV=production
    deploy:
      replicas: 2
      
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
      
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## 📅 Implementation Priority

### Week 1-2: Foundation
1. ✅ Enhanced withdrawal worker (DONE)
2. 🔄 Worker registry system
3. 🔄 Basic admin controls

### Week 3-4: Management
1. 📋 Admin dashboard
2. 📋 Real-time monitoring
3. 📋 Worker lifecycle management

### Week 5-7: Multi-Blockchain
1. 🌐 Ethereum support
2. 🌐 Bitcoin support  
3. 🌐 Provider abstraction

### Week 8-10: Scaling
1. 📈 Redis job queue
2. 📈 Auto-scaling
3. 📈 Load balancing

### Week 11-12: Production
1. 🚀 Health monitoring
2. 🚀 Deployment automation
3. 🚀 Performance optimization

---

## 💡 Key Success Metrics

- **Uptime**: 99.9% availability
- **Performance**: <30s average processing time
- **Throughput**: 10,000+ jobs/hour
- **Error Rate**: <0.1% failed jobs
- **Recovery**: <5min automatic recovery

---

**This roadmap evolves with your exchange growth. Review quarterly for updates.** 