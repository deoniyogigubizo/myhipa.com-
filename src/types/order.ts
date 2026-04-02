export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  sellerId: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
}

export interface OrderTracking {
  orderId: string;
  carrier: string;
  trackingNumber: string;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

export default Order;
