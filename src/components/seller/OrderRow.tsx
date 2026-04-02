import Link from 'next/link';
import Badge from '@/components/ui/badge';
import { formatRWF } from '@/lib/utils/currency';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderRowProps {
  id: string;
  orderNumber: string;
  customerName: string;
  customerAvatar?: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  processing: { label: 'Processing', variant: 'primary' },
  shipped: { label: 'Shipped', variant: 'default' },
  delivered: { label: 'Delivered', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};

export default function OrderRow({
  id,
  orderNumber,
  customerName,
  customerAvatar,
  products,
  total,
  status,
  createdAt,
}: OrderRowProps) {
  const config = statusConfig[status];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {/* Customer Avatar */}
        <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0">
          {customerAvatar ? (
            <img src={customerAvatar} alt={customerName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full flex items-center justify-center text-gray-400 font-medium">
              {customerName.charAt(0)}
            </div>
          )}
        </div>

        {/* Order Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link 
              href={`/seller/orders/${id}`}
              className="font-medium text-gray-900 hover:text-hipa-primary"
            >
              {orderNumber}
            </Link>
            <Badge variant={config.variant} size="sm">{config.label}</Badge>
          </div>
          <p className="text-sm text-gray-500">{customerName}</p>
          <p className="text-sm text-gray-500">
            {products.length} product{products.length > 1 ? 's' : ''} • {createdAt}
          </p>
        </div>

        {/* Total */}
        <div className="text-right">
          <p className="font-semibold text-gray-900">{formatRWF(total)}</p>
        </div>
      </div>
    </div>
  );
}
