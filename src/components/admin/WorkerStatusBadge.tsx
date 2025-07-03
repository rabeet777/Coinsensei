'use client';

interface WorkerStatusBadgeProps {
  status: 'active' | 'idle' | 'error' | 'stopped';
  size?: 'sm' | 'md' | 'lg';
}

export function WorkerStatusBadge({ status, size = 'md' }: WorkerStatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const statusConfig = {
    active: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-400',
      label: 'Active'
    },
    idle: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      dot: 'bg-gray-400',
      label: 'Idle'
    },
    error: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      dot: 'bg-red-400',
      label: 'Error'
    },
    stopped: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      dot: 'bg-yellow-400',
      label: 'Stopped'
    }
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} font-medium rounded-full ${config.bg} ${config.text}`}>
      <span className={`w-2 h-2 ${config.dot} rounded-full mr-2`}></span>
      {config.label}
    </span>
  );
} 