// Worker startup script
const { spawn } = require('child_process')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// Worker configurations
const workers = [
  {
    name: 'withdrawal-worker',
    script: 'src/worker/withdrawal-simple.ts',
    color: colors.green
  }
]

// Track spawned processes
const processes = []

function log(workerName, message, color = colors.reset) {
  const timestamp = new Date().toISOString()
  console.log(`${color}[${timestamp}] [${workerName}] ${message}${colors.reset}`)
}

function startWorker(workerConfig) {
  const { name, script, color } = workerConfig
  
  log(name, `Starting worker: ${script}`, color)
  
  // Use tsx to run TypeScript files directly
  const worker = spawn('npx', ['tsx', script], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' }
  })
  
  // Track the process
  processes.push({ name, process: worker })
  
  // Handle stdout
  worker.stdout.on('data', (data) => {
    const message = data.toString().trim()
    if (message) {
      log(name, message, color)
    }
  })
  
  // Handle stderr
  worker.stderr.on('data', (data) => {
    const message = data.toString().trim()
    if (message) {
      log(name, `ERROR: ${message}`, colors.red)
    }
  })
  
  // Handle process exit
  worker.on('close', (code) => {
    if (code === 0) {
      log(name, 'Worker exited successfully', color)
    } else {
      log(name, `Worker exited with code ${code}`, colors.red)
      
      // Restart worker after 5 seconds if it crashes
      setTimeout(() => {
        log(name, 'Restarting worker...', colors.cyan)
        startWorker(workerConfig)
      }, 5000)
    }
  })
  
  // Handle spawn errors
  worker.on('error', (error) => {
    log(name, `Failed to start worker: ${error.message}`, colors.red)
  })
  
  return worker
}

// Start all workers
function startAllWorkers() {
  console.log(`${colors.bright}🚀 Starting CoinSensei Workers${colors.reset}\n`)
  
  workers.forEach(workerConfig => {
    startWorker(workerConfig)
  })
  
  console.log(`\n${colors.bright}✅ Withdrawal worker started!${colors.reset}`)
  console.log(`${colors.cyan}Use Ctrl+C to stop worker${colors.reset}\n`)
}

// Graceful shutdown
function gracefulShutdown() {
  console.log(`\n${colors.yellow}🛑 Shutting down workers...${colors.reset}`)
  
  processes.forEach(({ name, process: worker }) => {
    log(name, 'Sending SIGTERM...', colors.yellow)
    worker.kill('SIGTERM')
  })
  
  setTimeout(() => {
    process.exit(0)
  }, 5000)
}

// Handle process signals
process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

// Start the workers
startAllWorkers()
