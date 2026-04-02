import { formatRWF } from '@/lib/utils/currency';

type EscrowStatus = 'pending' | 'held' | 'released' | 'disputed' | 'refunded';

interface EscrowBadgeProps {
  status: EscrowStatus;
  amount?: number;
}

const statusConfig: Record<EscrowStatus, { label: string; color: string; bgColor: string }> = {
  pending: {
    label: 'Payment Pending',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  held: {
    label: 'In Escrow',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  released: {
    label: 'Released',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  disputed: {
    label: 'Disputed',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  refunded: {
    label: 'Refunded',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
};

export default function EscrowBadge({ status, amount }: EscrowBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor}`}>
      <svg className={`w-4 h-4 ${config.color}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
      {amount !== undefined && (
        <span className={`text-sm ${config.color}`}>
          {formatRWF(amount)}
        </span>
      )}
    </div>
  );
}
