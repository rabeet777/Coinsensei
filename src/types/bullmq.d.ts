declare module 'bullmq' {
  export interface JobsOptions {
    removeOnComplete?: number | boolean
    removeOnFail?: number | boolean
    attempts?: number
    backoff?: {
      type: string
      delay?: number
    }
    delay?: number
    [key: string]: any
  }

  export interface WorkerOptions {
    connection?: any
    concurrency?: number
    [key: string]: any
  }

  export interface QueueOptions {
    connection?: any
    [key: string]: any
  }

  export class Queue {
    constructor(name: string, opts?: QueueOptions)
    add(name: string, data: any, opts?: JobsOptions): Promise<any>
    getJobs(types: string[], start?: number, end?: number, asc?: boolean): Promise<any[]>
    getJobCounts(...types: string[]): Promise<any>
    clean(grace: number, limit: number, type?: string): Promise<any>
    close(): Promise<void>
    [key: string]: any
  }

  export class Worker {
    constructor(queueName: string, processor: (job: any) => Promise<any>, opts?: WorkerOptions)
    close(): Promise<void>
    on(event: string, callback: (...args: any[]) => void): this
    [key: string]: any
  }

  export class Job {
    id?: string | number
    data: any
    opts: any
    progress(progress?: number | object): number | object | Promise<void>
    log(message: string): Promise<number>
    updateProgress(progress: number | object): Promise<void>
    [key: string]: any
  }
} 