export interface Wallet {
  user_id: string;
  address: string;
  balance: number;
  on_chain_balance?: number;
  trx_balance?: number;
  locked_balance?: number;
  total_balance?: number;
  derivation_path?: string;
  needs_consolidation?: boolean;
  needs_gas?: boolean;
  last_consolidation_at?: string;
  last_gas_topup_at?: string;
  last_sync_at?: string;
  is_processing?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface JobLog {
  id: string;
  job_id: string;
  job_type: 'gas-topup' | 'consolidation' | 'sync' | 'deposit-detection';
  status: 'pending' | 'active' | 'completed' | 'failed' | 'retrying';
  wallet_address?: string;
  user_id?: string;
  triggered_by: 'system' | 'manual' | 'deposit' | 'schedule';
  data: any;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
}

export interface WorkerStats {
  worker_name: string;
  active_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  queued_jobs: number;
  last_active: string;
  status: 'active' | 'idle' | 'error' | 'stopped';
}

export interface TriggerJobRequest {
  job_type: 'gas-topup' | 'consolidation' | 'sync';
  wallet_address: string;
  user_id?: string;
  priority?: number;
  data?: any;
}

export interface RetryJobRequest {
  job_id: string;
  reset_retry_count?: boolean;
}

export interface WalletFlags {
  needs_consolidation: boolean;
  needs_gas: boolean;
}

export interface SetFlagsRequest {
  wallet_address: string;
  flags: Partial<WalletFlags>;
}

export interface JobFilters {
  status?: string;
  job_type?: string;
  triggered_by?: string;
  wallet_address?: string;
  user_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export interface WalletFilters {
  needs_consolidation?: boolean;
  needs_gas?: boolean;
  min_balance?: string;
  max_balance?: string;
  limit?: number;
  offset?: number;
} 