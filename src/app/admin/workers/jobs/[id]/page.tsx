'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { JobDetailsCard } from '@/components/admin/JobDetailsCard';
import { RetryFailedJobModal } from '@/components/admin/RetryFailedJobModal';
import { JobLog } from '../../../../../types/worker';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRetryModal, setShowRetryModal] = useState(false);

  const fetchJobDetails = async () => {
    if (!params?.id) return;
    
    try {
      const response = await fetch(`/api/jobs/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
      } else {
        console.error('Failed to fetch job details');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (resetRetryCount: boolean) => {
    if (!params?.id) return;
    
    try {
      const response = await fetch('/api/jobs/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: params.id,
          reset_retry_count: resetRetryCount
        })
      });
      
      if (response.ok) {
        // Refresh job details
        fetchJobDetails();
      }
    } catch (error) {
      console.error('Failed to retry job:', error);
    }
  };

  useEffect(() => {
    if (params?.id) {
      fetchJobDetails();
    }
  }, [params?.id]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Job Not Found</h1>
          <p className="text-gray-600 mt-2">The requested job could not be found.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <JobDetailsCard
        job={job}
        onRetry={() => setShowRetryModal(true)}
        onClose={() => router.back()}
      />
      
      {showRetryModal && (
        <RetryFailedJobModal
          isOpen={showRetryModal}
          onClose={() => setShowRetryModal(false)}
          onRetry={handleRetry}
          job={job}
        />
      )}
    </div>
  );
} 