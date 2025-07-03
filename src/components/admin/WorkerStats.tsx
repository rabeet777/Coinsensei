'use client';

import { Card } from '@/components/ui/card';
import { WorkerStatusBadge } from './WorkerStatusBadge';
import { WorkerStats as WorkerStatsType } from '../../types/worker';

interface WorkerStatsProps {
  stats: WorkerStatsType[];
  isLoading?: boolean;
}

export function WorkerStats({ stats, isLoading }: WorkerStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((worker) => (
        <Card key={worker.worker_name} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg capitalize">
              {worker.worker_name.replace('-', ' ')}
            </h3>
            <WorkerStatusBadge status={worker.status} />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active:</span>
              <span className="font-medium text-blue-600">{worker.active_jobs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Queued:</span>
              <span className="font-medium text-yellow-600">{worker.queued_jobs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completed:</span>
              <span className="font-medium text-green-600">{worker.completed_jobs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Failed:</span>
              <span className="font-medium text-red-600">{worker.failed_jobs}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Last active: {new Date(worker.last_active).toLocaleString()}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
} 