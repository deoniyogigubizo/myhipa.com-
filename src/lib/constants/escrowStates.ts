export type EscrowState = 
  | 'created'
  | 'pending_payment'
  | 'paid'
  | 'held'
  | 'shipped'
  | 'delivered'
  | 'released'
  | 'disputed'
  | 'refunded'
  | 'cancelled';

export interface EscrowStateConfig {
  label: string;
  description: string;
  color: string;
  allowedTransitions: EscrowState[];
}

export const ESCROW_STATES: Record<EscrowState, EscrowStateConfig> = {
  created: {
    label: 'Created',
    description: 'Order has been created, waiting for payment',
    color: 'gray',
    allowedTransitions: ['pending_payment', 'cancelled'],
  },
  pending_payment: {
    label: 'Pending Payment',
    description: 'Awaiting buyer to make payment',
    color: 'yellow',
    allowedTransitions: ['paid', 'cancelled'],
  },
  paid: {
    label: 'Paid',
    description: 'Payment received, funds being held in escrow',
    color: 'blue',
    allowedTransitions: ['held', 'refunded'],
  },
  held: {
    label: 'In Escrow',
    description: 'Funds are securely held until delivery is confirmed',
    color: 'purple',
    allowedTransitions: ['shipped', 'disputed', 'refunded'],
  },
  shipped: {
    label: 'Shipped',
    description: 'Seller has shipped the order',
    color: 'cyan',
    allowedTransitions: ['delivered', 'disputed'],
  },
  delivered: {
    label: 'Delivered',
    description: 'Order has been delivered to buyer',
    color: 'green',
    allowedTransitions: ['released', 'disputed'],
  },
  released: {
    label: 'Released',
    description: 'Funds have been released to seller',
    color: 'emerald',
    allowedTransitions: [],
  },
  disputed: {
    label: 'Disputed',
    description: 'Transaction is under dispute resolution',
    color: 'red',
    allowedTransitions: ['refunded', 'released'],
  },
  refunded: {
    label: 'Refunded',
    description: 'Funds have been refunded to buyer',
    color: 'orange',
    allowedTransitions: [],
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Transaction was cancelled',
    color: 'gray',
    allowedTransitions: [],
  },
};

export default ESCROW_STATES;
