'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JobLog } from '../../types/worker';

interface JobDetailsCardProps {
  job: JobLog;
  onRetry?: () => void;
  onClose?: () => void;
}

export function JobDetailsCard({ job, onRetry, onClose }: JobDetailsCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'retrying': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return '-';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    
    if (diffMs < 1000) return `${diffMs}ms`;
    if (diffMs < 60000) return `${Math.round(diffMs / 1000)}s`;
    if (diffMs < 3600000) return `${Math.round(diffMs / 60000)}m`;
    return `${Math.round(diffMs / 3600000)}h`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Job Details</h1>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                {job.job_type}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {job.status === 'failed' && onRetry && (
              <Button onClick={onRetry} variant="outline">
                Retry Job
              </Button>
            )}
            {onClose && (
              <Button onClick={onClose} variant="ghost">
                Close
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Job ID:</span>
                <span className="font-mono">{job.job_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span>{job.job_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span>{job.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Triggered By:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {job.triggered_by}
                </span>
              </div>
              {job.wallet_address && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Wallet:</span>
                  <span className="font-mono">{job.wallet_address}</span>
                </div>
              )}
              {job.user_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">User ID:</span>
                  <span className="font-mono">{job.user_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timing Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Timing</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{new Date(job.created_at).toLocaleString()}</span>
              </div>
              {job.started_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Started:</span>
                  <span>{new Date(job.started_at).toLocaleString()}</span>
                </div>
              )}
              {job.completed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span>{new Date(job.completed_at).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span>{formatDuration(job.started_at, job.completed_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Retries:</span>
                <span className={job.retry_count > 0 ? 'text-orange-600' : 'text-gray-600'}>
                  {job.retry_count}/{job.max_retries}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {job.error_message && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-red-600">Error Message</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono">
                {job.error_message}
              </pre>
            </div>
          </div>
        )}

        {/* Job Data */}
        {job.data && Object.keys(job.data).length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Job Data</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {JSON.stringify(job.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
} 