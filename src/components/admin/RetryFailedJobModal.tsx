'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { JobLog } from '../../types/worker';

interface RetryFailedJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: (resetRetryCount: boolean) => void;
  job: JobLog;
}

export function RetryFailedJobModal({ isOpen, onClose, onRetry, job }: RetryFailedJobModalProps) {
  const [resetRetryCount, setResetRetryCount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onRetry(resetRetryCount);
      onClose();
    } catch (error) {
      console.error('Failed to retry job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Retry Failed Job</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-medium text-sm text-red-800 mb-2">Job Details</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-red-700">Job ID:</span>
              <span className="font-mono text-red-900">{job.job_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700">Type:</span>
              <span className="text-red-900">{job.job_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700">Status:</span>
              <span className="text-red-900">{job.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700">Retries:</span>
              <span className="text-red-900">{job.retry_count}/{job.max_retries}</span>
            </div>
            {job.wallet_address && (
              <div className="flex justify-between">
                <span className="text-red-700">Wallet:</span>
                <span className="font-mono text-red-900">{job.wallet_address}</span>
              </div>
            )}
            {job.error_message && (
              <div className="mt-2">
                <span className="text-red-700">Error:</span>
                <div className="text-red-900 text-xs mt-1 p-2 bg-red-100 rounded border">
                  {job.error_message}
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="resetRetryCount"
              checked={resetRetryCount}
              onChange={(e) => setResetRetryCount(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="resetRetryCount" className="text-sm">
              Reset retry count (start fresh from 0/{job.max_retries})
            </Label>
          </div>

          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>Note:</strong> {resetRetryCount 
              ? `The job will be retried with retry count reset to 0, giving it ${job.max_retries} fresh attempts.`
              : `The job will be retried with current retry count (${job.retry_count}/${job.max_retries}). It has ${job.max_retries - job.retry_count} attempts remaining.`
            }
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Retrying...' : 'Retry Job'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 