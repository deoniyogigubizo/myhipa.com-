export type SellerStatus = 'pending' | 'active' | 'suspended' | 'banned';

export interface Seller {
  id: string;
  userId: string;
  name: string;
  slug: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  orderCount: number;
  isVerified: boolean;
  status: SellerStatus;
  location?: {
    city: string;
    country: string;
  };
  contact?: {
    email: string;
    phone?: string;
  };
  social?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SellerAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageRating: number;
  conversionRate: number;
  topProducts: Array<{
    id: string;
    title: string;
    sales: number;
    revenue: number;
  }>;
  salesByDay: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

export default Seller;
