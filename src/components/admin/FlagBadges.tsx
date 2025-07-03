'use client';

import { WalletFlags } from '../../types/worker';

interface FlagBadgesProps {
  flags: WalletFlags;
  size?: 'sm' | 'md';
}

export function FlagBadges({ flags, size = 'md' }: FlagBadgesProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  const badges = [];

  if (flags.needs_consolidation) {
    badges.push(
      <span 
        key="consolidation"
        className={`inline-flex items-center ${sizeClasses[size]} font-medium rounded-full bg-orange-100 text-orange-800`}
      >
        <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
        Needs Consolidation
      </span>
    );
  }

  if (flags.needs_gas) {
    badges.push(
      <span 
        key="gas"
        className={`inline-flex items-center ${sizeClasses[size]} font-medium rounded-full bg-blue-100 text-blue-800`}
      >
        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
        Needs Gas
      </span>
    );
  }

  if (badges.length === 0) {
    return (
      <span className={`inline-flex items-center ${sizeClasses[size]} font-medium rounded-full bg-green-100 text-green-800`}>
        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
        All Good
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges}
    </div>
  );
} 