'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FlagBadges } from './FlagBadges';
import { TriggerJobModal } from './TriggerJobModal';
import { Wallet, WalletFilters } from '../../types/worker';

interface WalletTableProps {
  wallets: Wallet[];
  isLoading?: boolean;
  onTriggerJob?: (walletAddress: string, jobType: string) => void;
  onSetFlags?: (walletAddress: string, flags: any) => void;
}

export function WalletTable({ wallets, isLoading, onTriggerJob, onSetFlags }: WalletTableProps) {
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [showTriggerModal, setShowTriggerModal] = useState(false);

  const handleTriggerJob = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setShowTriggerModal(true);
  };

  const handleTriggerSubmit = (jobType: string, data: any) => {
    if (selectedWallet && onTriggerJob) {
      onTriggerJob(selectedWallet.address, jobType);
    }
    setShowTriggerModal(false);
    setSelectedWallet(null);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Last Sync</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wallets.map((wallet) => (
              <TableRow key={wallet.user_id}>
                <TableCell className="font-mono text-sm">
                  {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {wallet.user_id}
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                    TRON
                  </span>
                </TableCell>
                <TableCell className="font-mono">
                  {wallet.balance?.toFixed(6) || '0.000000'}
                </TableCell>
                <TableCell>
                  <FlagBadges 
                    flags={{
                      needs_consolidation: wallet.needs_consolidation || false,
                      needs_gas: wallet.needs_gas || false
                    }}
                    size="sm"
                  />
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {wallet.last_sync_at ? new Date(wallet.last_sync_at).toLocaleString() : 'Never'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTriggerJob(wallet)}
                    >
                      Trigger Job
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {showTriggerModal && selectedWallet && (
        <TriggerJobModal
          isOpen={showTriggerModal}
          onClose={() => setShowTriggerModal(false)}
          onTrigger={handleTriggerSubmit}
          wallet={selectedWallet}
        />
      )}
    </>
  );
} 