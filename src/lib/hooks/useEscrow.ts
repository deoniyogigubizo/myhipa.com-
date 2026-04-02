'use client';

import { useState, useCallback } from 'react';

export type EscrowStatus = 'pending' | 'held' | 'released' | 'disputed' | 'refunded';

export interface EscrowTransaction {
  id: string;
  orderId: string;
  amount: number;
  status: EscrowStatus;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  releasedAt?: string;
}

export function useEscrow() {
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEscrowTransactions = useCallback(async (orderId?: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data
    const mockTransactions: EscrowTransaction[] = orderId 
      ? [{
          id: '1',
          orderId,
          amount: 50000,
          status: 'held',
          buyerId: 'buyer1',
          sellerId: 'seller1',
          createdAt: '2026-03-20T10:00:00Z',
        }]
      : [
          {
            id: '1',
            orderId: 'order1',
            amount: 50000,
            status: 'held',
            buyerId: 'buyer1',
            sellerId: 'seller1',
            createdAt: '2026-03-20T10:00:00Z',
          },
          {
            id: '2',
            orderId: 'order2',
            amount: 75000,
            status: 'released',
            buyerId: 'buyer2',
            sellerId: 'seller1',
            createdAt: '2026-03-19T10:00:00Z',
            releasedAt: '2026-03-20T10:00:00Z',
          },
        ];
    
    setEscrowTransactions(mockTransactions);
    setIsLoading(false);
  }, []);

  const releaseFunds = useCallback(async (escrowId: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setEscrowTransactions(prev =>
      prev.map(t =>
        t.id === escrowId
          ? { ...t, status: 'released' as EscrowStatus, releasedAt: new Date().toISOString() }
          : t
      )
    );
    
    setIsLoading(false);
  }, []);

  const disputeTransaction = useCallback(async (escrowId: string, reason: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setEscrowTransactions(prev =>
      prev.map(t =>
        t.id === escrowId
          ? { ...t, status: 'disputed' as EscrowStatus }
          : t
      )
    );
    
    setIsLoading(false);
  }, []);

  const getEscrowBalance = useCallback(() => {
    return escrowTransactions
      .filter(t => t.status === 'held')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [escrowTransactions]);

  return {
    escrowTransactions,
    isLoading,
    fetchEscrowTransactions,
    releaseFunds,
    disputeTransaction,
    getEscrowBalance,
  };
}
