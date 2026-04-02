export type UserRole = 'buyer' | 'seller' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  address?: {
    city: string;
    country: string;
  };
  preferences?: {
    language: string;
    currency: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  wishlist: string[];
  recentlyViewed: string[];
}

export interface UserStats {
  totalOrders: number;
  totalSpent: number;
  reviewsWritten: number;
  memberSince: string;
}

export default User;
