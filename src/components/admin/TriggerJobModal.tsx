'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Wallet } from '../../types/worker';

interface TriggerJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrigger: (jobType: string, data: any) => void;
  wallet: Wallet;
}

export function TriggerJobModal({ isOpen, onClose, onTrigger, wallet }: TriggerJobModalProps) {
  const [jobType, setJobType] = useState<string>('');
  const [priority, setPriority] = useState<string>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobType) return;

    setIsSubmitting(true);
    try {
      const data = {
        wallet_address: wallet.address,
        user_id: wallet.user_id,
        priority: priority === 'high' ? 10 : priority === 'low' ? 1 : 5,
        triggered_by: 'manual'
      };
      
      await onTrigger(jobType, data);
      onClose();
    } catch (error) {
      console.error('Failed to trigger job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Trigger Job</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-sm text-gray-700 mb-2">Target Wallet</h3>
          <div className="text-sm">
            <div className="font-mono">{wallet.address}</div>
            <div className="text-gray-600">User ID: {wallet.user_id}</div>
            <div className="text-gray-600">Network: TRON</div>
            <div className="text-gray-600">Balance: {wallet.balance.toFixed(6)}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="jobType">Job Type</Label>
            <Select value={jobType} onValueChange={setJobType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gas-topup">Gas Top-up</SelectItem>
                <SelectItem value="consolidation">Consolidation</SelectItem>
                <SelectItem value="sync">Sync Balance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!jobType || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Triggering...' : 'Trigger Job'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 