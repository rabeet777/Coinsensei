'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RetryFailedJobModal } from './RetryFailedJobModal';
import { JobLog, JobFilters } from '../../types/worker';

interface JobLogsTableProps {
  jobs: JobLog[];
  isLoading?: boolean;
  filters?: JobFilters;
  onFiltersChange?: (filters: JobFilters) => void;
  onRetryJob?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
}

export function JobLogsTable({ 
  jobs, 
  isLoading, 
  filters = {}, 
  onFiltersChange, 
  onRetryJob,
  onViewDetails 
}: JobLogsTableProps) {
  const [selectedJob, setSelectedJob] = useState<JobLog | null>(null);
  const [showRetryModal, setShowRetryModal] = useState(false);

  const handleRetryJob = (job: JobLog) => {
    setSelectedJob(job);
    setShowRetryModal(true);
  };

  const handleRetrySubmit = (resetRetryCount: boolean) => {
    if (selectedJob && onRetryJob) {
      onRetryJob(selectedJob.id);
    }
    setShowRetryModal(false);
    setSelectedJob(null);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' },
      active: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-400' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-400' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400' },
      retrying: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-400' }
    };

    const statusConfig = config[status as keyof typeof config] || config.pending;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
        <span className={`w-2 h-2 ${statusConfig.dot} rounded-full mr-2`}></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-4">
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onFiltersChange?.({ ...filters, status: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="retrying">Retrying</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.job_type || 'all'}
            onValueChange={(value) => onFiltersChange?.({ ...filters, job_type: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="gas-topup">Gas Top-up</SelectItem>
              <SelectItem value="consolidation">Consolidation</SelectItem>
              <SelectItem value="sync">Sync</SelectItem>
              <SelectItem value="deposit-detection">Deposit Detection</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.triggered_by || 'all'}
            onValueChange={(value) => onFiltersChange?.({ ...filters, triggered_by: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Triggered By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="schedule">Schedule</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Triggered By</TableHead>
              <TableHead>Retries</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-sm">
                  {job.job_id.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                    {job.job_type}
                  </span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(job.status)}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {job.wallet_address ? `${job.wallet_address.slice(0, 8)}...` : '-'}
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {job.triggered_by}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.retry_count > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {job.retry_count}/{job.max_retries}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {new Date(job.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {job.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetryJob(job)}
                      >
                        Retry
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewDetails?.(job.id)}
                    >
                      Details
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {showRetryModal && selectedJob && (
        <RetryFailedJobModal
          isOpen={showRetryModal}
          onClose={() => setShowRetryModal(false)}
          onRetry={handleRetrySubmit}
          job={selectedJob}
        />
      )}
    </>
  );
} 