export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  tags: string[];
  stock: number;
  sku?: string;
  sellerId: string;
  sellerName: string;
  sellerSlug: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  options: Record<string, string>;
  images: string[];
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  content: string;
  images?: string[];
  isVerified: boolean;
  helpful: number;
  createdAt: string;
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  verified?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
}

export default Product;
