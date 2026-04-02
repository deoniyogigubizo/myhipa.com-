'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

interface ProductFormData {
  title: string;
  slug: string;
  description: string;
  category: {
    primary: string;
    secondary: string;
    tertiary: string;
    path: string[];
  };
  media: Array<{
    url: string;
    type: 'image' | 'video' | 'video_360';
    isPrimary: boolean;
    order: number;
  }>;
  pricing: {
    base: number;
    compareAt: number;
    currency: string;
  };
  variants: Array<{
    name: string;
    attributes: Record<string, string>;
    price: number;
    stock: number;
    sku: string;
    barcode: string;
  }>;
  inventory: {
    totalStock: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    allowBackorder: boolean;
  };
  shipping: {
    weight: number;
    dimensions: {
      l: number;
      w: number;
      h: number;
    };
    requiresShipping: boolean;
    digitalDownload: boolean;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    customSlug: string;
  };
  tags: string[];
  condition: 'new' | 'used' | 'refurbished';
  status: 'draft' | 'active' | 'paused' | 'archived';
}

const CATEGORIES = {
  'Electronics & Media': {
    'Mobile & Accessories': ['Smartphones', 'Bluetooth Headphones', 'Power Banks', 'Phone Cases', 'Screen Protectors'],
    'Computing & Laptops': ['Gaming Laptops', 'Tablets', 'External Hard Drives', 'Monitors', 'Keyboards'],
    'Entertainment & Gaming': ['Video Game Consoles', 'Smart TVs', 'Streaming Devices', 'Gaming Accessories', 'Speakers'],
  },
  'Fashion & Apparel': {
    "Men's & Women's Clothing": ['Denim Jeans', 'Activewear', 'Formal Dresses', 'T-Shirts', 'Jackets'],
    'Footwear': ['Running Shoes', 'Leather Boots', 'Sandals', 'Sneakers', 'Heels'],
    'Accessories': ['Leather Wallets', 'Sunglasses', 'Wristwatches', 'Belts', 'Handbags'],
  },
  'Home, Garden & Tools': {
    'Furniture & Decor': ['Sectional Sofas', 'Wall Art', 'Area Rugs', 'Coffee Tables', 'Bookshelves'],
    'Kitchen & Dining': ['Air Fryers', 'Knife Sets', 'Espresso Machines', 'Cookware Sets', 'Dinnerware'],
    'Outdoor & Gardening': ['Lawn Mowers', 'Patio Sets', 'Gardening Tools', 'Grills', 'Outdoor Lighting'],
  },
  'Health, Beauty & Personal Care': {
    'Skincare & Cosmetics': ['Moisturizers', 'Foundation Makeup', 'Sunscreens', 'Serums', 'Lipsticks'],
    'Haircare & Grooming': ['Hair Dryers', 'Electric Shavers', 'Shampoos', 'Hair Straighteners', 'Trimmers'],
    'Health & Wellness': ['Multivitamins', 'Yoga Mats', 'Protein Powders', 'Fitness Trackers', 'Massage Guns'],
  },
  'Sports, Outdoors & Travel': {
    'Fitness & Gym': ['Dumbbells', 'Treadmills', 'Resistance Bands', 'Weight Benches', 'Exercise Bikes'],
    'Camping & Hiking': ['Tents', 'Sleeping Bags', 'Hiking Boots', 'Backpacks', 'Camping Stoves'],
    'Luggage & Travel Gear': ['Carry-on Suitcases', 'Backpacks', 'Travel Pillows', 'Duffel Bags', 'Travel Accessories'],
  },
  'Baby & Kids': {
    'Toys & Games': ['LEGO Sets', 'Board Games', 'Dolls', 'Action Figures', 'Educational Toys'],
    'Baby Essentials': ['Diapers', 'Baby Strollers', 'Car Seats', 'Baby Monitors', 'Feeding Bottles'],
  },
  'Automotive & Industrial': {
    'Car Parts & Accessories': ['Tires', 'Dash Cams', 'Engine Oil', 'Car Batteries', 'Floor Mats'],
    'Tools & Equipment': ['Power Drills', 'Workbenches', 'Safety Gear', 'Tool Sets', 'Welding Equipment'],
  },
  'Pet Supplies': {
    'Pet Food & Treats': ['Dry Dog Food', 'Catnip', 'Bird Seed', 'Cat Food', 'Fish Food'],
    'Pet Care & Toys': ['Dog Leashes', 'Litter Boxes', 'Fish Tanks', 'Pet Beds', 'Chew Toys'],
  },
  'Groceries & Essentials': {
    'Fresh & Frozen Food': ['Organic Produce', 'Frozen Pizzas', 'Plant-based Milk', 'Frozen Vegetables', 'Ice Cream'],
    'Household Supplies': ['Laundry Detergent', 'Toilet Paper', 'Cleaning Sprays', 'Paper Towels', 'Trash Bags'],
  },
  'Digital Products': {
    'Software & Apps': ['Productivity Tools', 'Mobile Games', 'VPN Services', 'Antivirus Software', 'Design Software'],
    'E-Learning & Media': ['Online Courses', 'E-books', 'Music Subscriptions', 'Streaming Services', 'Audiobooks'],
  },
};

export default function EditProduct() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    slug: '',
    description: '',
    category: {
      primary: '',
      secondary: '',
      tertiary: '',
      path: [],
    },
    media: [],
    pricing: {
      base: 0,
      compareAt: 0,
      currency: 'RWF',
    },
    variants: [],
    inventory: {
      totalStock: 0,
      lowStockThreshold: 3,
      trackInventory: true,
      allowBackorder: false,
    },
    shipping: {
      weight: 0,
      dimensions: {
        l: 0,
        w: 0,
        h: 0,
      },
      requiresShipping: true,
      digitalDownload: false,
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      customSlug: '',
    },
    tags: [],
    condition: 'new',
    status: 'draft',
  });

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/seller/products/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      const product = data.product;

      // Map API response to form data
      setFormData({
        title: product.title || '',
        slug: product.slug || '',
        description: product.description || '',
        category: {
          primary: product.category?.primary || '',
          secondary: product.category?.secondary || '',
          tertiary: product.category?.tertiary || '',
          path: product.category?.path || [],
        },
        media: product.media?.map((m: any, index: number) => ({
          url: typeof m === 'string' ? m : m.url,
          type: m.type || 'image',
          isPrimary: index === 0,
          order: index,
        })) || [],
        pricing: {
          base: product.pricing?.base || 0,
          compareAt: product.pricing?.compareAt || 0,
          currency: product.pricing?.currency || 'RWF',
        },
        variants: product.variants?.map((v: any) => ({
          name: v.name || '',
          attributes: v.attributes || {},
          price: v.price || 0,
          stock: v.stock || 0,
          sku: v.sku || '',
          barcode: v.barcode || '',
        })) || [],
        inventory: {
          totalStock: product.inventory?.totalStock || 0,
          lowStockThreshold: product.inventory?.lowStockThreshold || 3,
          trackInventory: product.inventory?.trackInventory ?? true,
          allowBackorder: product.inventory?.allowBackorder ?? false,
        },
        shipping: {
          weight: product.shipping?.weight || 0,
          dimensions: {
            l: product.shipping?.dimensions?.l || 0,
            w: product.shipping?.dimensions?.w || 0,
            h: product.shipping?.dimensions?.h || 0,
          },
          requiresShipping: product.shipping?.requiresShipping ?? true,
          digitalDownload: product.shipping?.digitalDownload ?? false,
        },
        seo: {
          metaTitle: product.seo?.metaTitle || '',
          metaDescription: product.seo?.metaDescription || '',
          customSlug: product.seo?.customSlug || '',
        },
        tags: product.tags || [],
        condition: product.condition || 'new',
        status: product.status || 'draft',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof ProductFormData] as object),
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setIsSaving(true);
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/seller/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update product');
      }

      setSuccess('Product updated successfully!');
      setTimeout(() => {
        router.push(`/seller/products/${params.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/seller/products/${params.id}`}
                className="text-sm text-teal-600 hover:underline mb-2 block"
              >
                ← Back to Product
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-sm text-gray-500">Update product information</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category.primary}
                    onChange={(e) => handleNestedInputChange('category', 'primary', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    {Object.keys(CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory
                  </label>
                  <select
                    value={formData.category.secondary}
                    onChange={(e) => handleNestedInputChange('category', 'secondary', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    disabled={!formData.category.primary}
                  >
                    <option value="">Select Subcategory</option>
                    {formData.category.primary && CATEGORIES[formData.category.primary as keyof typeof CATEGORIES] &&
                      Object.keys(CATEGORIES[formData.category.primary as keyof typeof CATEGORIES]).map((subcat) => (
                        <option key={subcat} value={subcat}>{subcat}</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => handleInputChange('condition', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price (RWF) *
                </label>
                <input
                  type="number"
                  value={formData.pricing.base}
                  onChange={(e) => handleNestedInputChange('pricing', 'base', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compare at Price (RWF)
                </label>
                <input
                  type="number"
                  value={formData.pricing.compareAt}
                  onChange={(e) => handleNestedInputChange('pricing', 'compareAt', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Stock *
                </label>
                <input
                  type="number"
                  value={formData.inventory.totalStock}
                  onChange={(e) => handleNestedInputChange('inventory', 'totalStock', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  value={formData.inventory.lowStockThreshold}
                  onChange={(e) => handleNestedInputChange('inventory', 'lowStockThreshold', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="trackInventory"
                  checked={formData.inventory.trackInventory}
                  onChange={(e) => handleNestedInputChange('inventory', 'trackInventory', e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="trackInventory" className="ml-2 text-sm text-gray-700">
                  Track inventory
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowBackorder"
                  checked={formData.inventory.allowBackorder}
                  onChange={(e) => handleNestedInputChange('inventory', 'allowBackorder', e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="allowBackorder" className="ml-2 text-sm text-gray-700">
                  Allow backorder
                </label>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags && Array.isArray(formData.tags) ? formData.tags.join(', ') : ''}
                onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="e.g., electronics, smartphone, android"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Link
              href={`/seller/products/${params.id}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
