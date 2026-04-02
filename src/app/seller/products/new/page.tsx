'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    bulkPricing: Array<{
      minQty: number;
      discountPct: number;
    }>;
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

const STEPS = [
  { id: 'basic', label: 'Basic Info', icon: '1' },
  { id: 'media', label: 'Media', icon: '2' },
  { id: 'pricing', label: 'Pricing', icon: '3' },
  { id: 'variants', label: 'Variants', icon: '4' },
  { id: 'inventory', label: 'Inventory', icon: '5' },
  { id: 'shipping', label: 'Shipping', icon: '6' },
  { id: 'seo', label: 'SEO', icon: '7' },
  { id: 'review', label: 'Review & Publish', icon: '8' },
];

export default function AddProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      bulkPricing: [],
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
      dimensions: { l: 0, w: 0, h: 0 },
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

  const [newTag, setNewTag] = useState('');
  const [newBulkPricing, setNewBulkPricing] = useState({ minQty: 0, discountPct: 0 });
  const [newVariant, setNewVariant] = useState({
    name: '',
    attributes: {} as Record<string, string>,
    price: 0,
    stock: 0,
    sku: '',
    barcode: '',
  });
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
      seo: {
        ...prev.seo,
        metaTitle: title.substring(0, 70),
      },
    }));
  };

  const handleCategoryChange = (level: 'primary' | 'secondary' | 'tertiary', value: string) => {
    setFormData((prev) => {
      const newCategory = { ...prev.category, [level]: value };
      
      if (level === 'primary') {
        newCategory.secondary = '';
        newCategory.tertiary = '';
        newCategory.path = [value];
      } else if (level === 'secondary') {
        newCategory.tertiary = '';
        newCategory.path = [newCategory.primary, value];
      } else {
        newCategory.path = [newCategory.primary, newCategory.secondary, value];
      }
      
      return { ...prev, category: newCategory };
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const addBulkPricing = () => {
    if (newBulkPricing.minQty > 0 && newBulkPricing.discountPct > 0) {
      setFormData((prev) => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          bulkPricing: [...prev.pricing.bulkPricing, { ...newBulkPricing }],
        },
      }));
      setNewBulkPricing({ minQty: 0, discountPct: 0 });
    }
  };

  const removeBulkPricing = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        bulkPricing: prev.pricing.bulkPricing.filter((_, i) => i !== index),
      },
    }));
  };

  const addVariant = () => {
    if (newVariant.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        variants: [...prev.variants, { ...newVariant }],
      }));
      setNewVariant({
        name: '',
        attributes: {},
        price: 0,
        stock: 0,
        sku: '',
        barcode: '',
      });
    }
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const addMedia = () => {
    if (newMediaUrl.trim()) {
      const isPrimary = formData.media.length === 0;
      setFormData((prev) => ({
        ...prev,
        media: [
          ...prev.media,
          {
            url: newMediaUrl.trim(),
            type: 'image',
            isPrimary,
            order: prev.media.length,
          },
        ],
      }));
      setNewMediaUrl('');
    }
  };

  const removeMedia = (index: number) => {
    setFormData((prev) => {
      const newMedia = prev.media.filter((_, i) => i !== index);
      if (newMedia.length > 0 && !newMedia.some((m) => m.isPrimary)) {
        newMedia[0].isPrimary = true;
      }
      return { ...prev, media: newMedia };
    });
  };

  const setPrimaryMedia = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.map((m, i) => ({
        ...m,
        isPrimary: i === index,
      })),
    }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      setSuccess('Product created successfully!');
      setTimeout(() => {
        router.push('/seller/products');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5DC' }}>
      {/* Header */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/seller/products"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-xl font-semibold text-white">Add New Product</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, status: 'draft' }))}
                className="px-4 py-2 text-sm font-medium text-white border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(index)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all ${
                    index === currentStep
                      ? 'text-white shadow-lg scale-110'
                      : index < currentStep
                      ? 'text-white'
                      : 'text-gray-600 bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: index === currentStep ? '#87CEEB' : index < currentStep ? '#000000' : undefined,
                  }}
                >
                  {index < currentStep ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-12 sm:w-20 h-1 mx-1 ${
                      index < currentStep ? '' : 'bg-gray-200'
                    }`}
                    style={{ backgroundColor: index < currentStep ? '#000000' : undefined }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`text-xs font-medium ${
                  index === currentStep ? 'text-black' : 'text-gray-500'
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-black mb-2">Basic Information</h2>
                <p className="text-gray-600">Start with the essentials about your product</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                  style={{ '--tw-ring-color': '#87CEEB' } as any}
                  onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  placeholder="Enter product title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  URL Slug *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">/product/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    placeholder="product-slug"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                  onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  placeholder="Describe your product in detail..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Primary Category *
                  </label>
                  <select
                    value={formData.category.primary}
                    onChange={(e) => handleCategoryChange('primary', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    required
                  >
                    <option value="">Select category</option>
                    {Object.keys(CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Secondary Category
                  </label>
                  <select
                    value={formData.category.secondary}
                    onChange={(e) => handleCategoryChange('secondary', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    disabled={!formData.category.primary}
                  >
                    <option value="">Select subcategory</option>
                    {formData.category.primary &&
                      Object.keys(CATEGORIES[formData.category.primary as keyof typeof CATEGORIES] || {}).map((subcat) => (
                        <option key={subcat} value={subcat}>{subcat}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Tertiary Category
                  </label>
                  <select
                    value={formData.category.tertiary}
                    onChange={(e) => handleCategoryChange('tertiary', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    disabled={!formData.category.secondary}
                  >
                    <option value="">Select type</option>
                    {formData.category.primary &&
                      formData.category.secondary &&
                      ((CATEGORIES[formData.category.primary as keyof typeof CATEGORIES] as Record<string, string[]>)?.[formData.category.secondary] || []).map((type: string) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Condition *
                </label>
                <div className="flex gap-4">
                  {(['new', 'used', 'refurbished'] as const).map((cond) => (
                    <label key={cond} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="condition"
                        value={cond}
                        checked={formData.condition === cond}
                        onChange={(e) => setFormData((prev) => ({ ...prev, condition: e.target.value as 'new' | 'used' | 'refurbished' }))}
                        className="w-4 h-4"
                        style={{ accentColor: '#87CEEB' }}
                      />
                      <span className="text-sm text-gray-700 capitalize">{cond}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    placeholder="Add a tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-6 py-3 text-white rounded-lg font-medium transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#000000' }}
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: '#87CEEB', color: '#000000' }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Media */}
          {currentStep === 1 && (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-black mb-2">Product Media</h2>
                <p className="text-gray-600">Add images and videos to showcase your product</p>
              </div>
              
              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Upload Image from Device
                  </label>
                  <label className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#87CEEB] transition-colors">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600">Click to upload image from device</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const isPrimary = formData.media.length === 0;
                            setFormData((prev) => ({
                              ...prev,
                              media: [
                                ...prev.media,
                                {
                                  url: reader.result as string,
                                  type: 'image',
                                  isPrimary,
                                  order: prev.media.length,
                                },
                              ],
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Camera Capture */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Take Photo with Camera
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCapturing(true)}
                    className="flex items-center justify-center gap-2 w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#87CEEB] transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-600">Open camera to take photo</span>
                  </button>
                </div>

                {/* Camera Modal */}
                {isCapturing && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-4 max-w-lg w-full mx-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Take a Photo</h3>
                        <button
                          type="button"
                          onClick={() => {
                            const video = document.getElementById('camera-feed') as HTMLVideoElement;
                            if (video && video.srcObject) {
                              (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
                            }
                            setIsCapturing(false);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                      <video
                        id="camera-feed"
                        autoPlay
                        playsInline
                        className="w-full rounded-lg mb-4 bg-black"
                        ref={(el) => {
                          if (el && !el.srcObject) {
                            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                              .then(stream => {
                                el.srcObject = stream;
                              })
                              .catch(err => {
                                console.error('Camera error:', err);
                                alert('Could not access camera. Please check permissions.');
                                setIsCapturing(false);
                              });
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const video = document.getElementById('camera-feed') as HTMLVideoElement;
                          if (video) {
                            const canvas = document.createElement('canvas');
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(video, 0, 0);
                            const dataUrl = canvas.toDataURL('image/jpeg');
                            const isPrimary = formData.media.length === 0;
                            setFormData((prev) => ({
                              ...prev,
                              media: [
                                ...prev.media,
                                {
                                  url: dataUrl,
                                  type: 'image',
                                  isPrimary,
                                  order: prev.media.length,
                                },
                              ],
                            }));
                            (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
                            setIsCapturing(false);
                          }
                        }}
                        className="w-full px-6 py-3 text-white rounded-lg font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: '#87CEEB', color: '#000000' }}
                      >
                        📸 Capture Photo
                      </button>
                    </div>
                  </div>
                )}

                {/* URL Input */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Or Add Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newMediaUrl}
                      onChange={(e) => setNewMediaUrl(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                      onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                      onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                      placeholder="https://example.com/image.jpg"
                    />
                    <button
                      type="button"
                      onClick={addMedia}
                      className="px-6 py-3 text-white rounded-lg font-medium transition-colors hover:opacity-90"
                      style={{ backgroundColor: '#87CEEB', color: '#000000' }}
                    >
                      Add Image
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.media.map((media, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={media.url}
                      alt={`Product ${index + 1}`}
                      className={`w-full h-32 object-cover rounded-lg border-2 ${
                        media.isPrimary ? 'border-black' : 'border-gray-200'
                      }`}
                    />
                    {media.isPrimary && (
                      <span className="absolute top-2 left-2 px-2 py-1 text-white text-xs rounded font-medium" style={{ backgroundColor: '#000000' }}>
                        Primary
                      </span>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!media.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryMedia(index)}
                          className="p-1 bg-white rounded shadow hover:bg-gray-100"
                          title="Set as primary"
                        >
                          ⭐
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="p-1 bg-white rounded shadow hover:bg-red-50 text-red-600"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {currentStep === 2 && (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-black mb-2">Pricing</h2>
                <p className="text-gray-600">Set your product pricing and bulk discounts</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Base Price (RWF) *
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.base}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      pricing: { ...prev.pricing, base: Number(e.target.value) },
                    }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Compare At Price (RWF)
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.compareAt}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      pricing: { ...prev.pricing, compareAt: Number(e.target.value) },
                    }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Original price for strikethrough display</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Bulk Pricing Tiers
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    value={newBulkPricing.minQty}
                    onChange={(e) => setNewBulkPricing((prev) => ({ ...prev, minQty: Number(e.target.value) }))}
                    className="w-32 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    placeholder="Min Qty"
                    min="1"
                  />
                  <input
                    type="number"
                    value={newBulkPricing.discountPct}
                    onChange={(e) => setNewBulkPricing((prev) => ({ ...prev, discountPct: Number(e.target.value) }))}
                    className="w-32 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    placeholder="Discount %"
                    min="0"
                    max="100"
                  />
                  <button
                    type="button"
                    onClick={addBulkPricing}
                    className="px-6 py-3 text-white rounded-lg font-medium transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#000000' }}
                  >
                    Add Tier
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.pricing.bulkPricing.map((bp, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F5F5DC' }}>
                      <span className="text-sm font-medium">
                        Buy {bp.minQty}+ → {bp.discountPct}% off
                      </span>
                      <button
                        type="button"
                        onClick={() => removeBulkPricing(index)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Variants */}
          {currentStep === 3 && (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-black mb-2">Product Variants</h2>
                <p className="text-gray-600">Add different variations like size, color, or storage</p>
              </div>
              
              <div className="border-2 border-gray-200 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Variant Name
                    </label>
                    <input
                      type="text"
                      value={newVariant.name}
                      onChange={(e) => setNewVariant((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                      onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                      onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                      placeholder="e.g., Black / 128GB"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Price (RWF)
                    </label>
                    <input
                      type="number"
                      value={newVariant.price}
                      onChange={(e) => setNewVariant((prev) => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                      onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                      onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={newVariant.stock}
                      onChange={(e) => setNewVariant((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                      onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                      onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={newVariant.sku}
                      onChange={(e) => setNewVariant((prev) => ({ ...prev, sku: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                      onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                      onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                      placeholder="SKU-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={newVariant.barcode}
                      onChange={(e) => setNewVariant((prev) => ({ ...prev, barcode: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                      onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                      onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                      placeholder="123456789"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addVariant}
                  className="px-6 py-3 text-white rounded-lg font-medium transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#87CEEB', color: '#000000' }}
                >
                  Add Variant
                </button>
              </div>

              <div className="space-y-2">
                {formData.variants.map((variant, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#F5F5DC' }}>
                    <div>
                      <p className="font-semibold text-black">{variant.name}</p>
                      <p className="text-sm text-gray-600">
                        {variant.price.toLocaleString()} RWF • Stock: {variant.stock}
                        {variant.sku && ` • SKU: ${variant.sku}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Inventory */}
          {currentStep === 4 && (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-black mb-2">Inventory</h2>
                <p className="text-gray-600">Manage your stock and inventory settings</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Total Stock *
                  </label>
                  <input
                    type="number"
                    value={formData.inventory.totalStock}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      inventory: { ...prev.inventory, totalStock: Number(e.target.value) },
                    }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.inventory.lowStockThreshold}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      inventory: { ...prev.inventory, lowStockThreshold: Number(e.target.value) },
                    }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this number</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.inventory.trackInventory}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      inventory: { ...prev.inventory, trackInventory: e.target.checked },
                    }))}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: '#87CEEB' }}
                  />
                  <div>
                    <p className="font-semibold text-black">Track Inventory</p>
                    <p className="text-sm text-gray-500">Enable stock tracking for this product</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.inventory.allowBackorder}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      inventory: { ...prev.inventory, allowBackorder: e.target.checked },
                    }))}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: '#87CEEB' }}
                  />
                  <div>
                    <p className="font-semibold text-black">Allow Backorders</p>
                    <p className="text-sm text-gray-500">Allow customers to order when out of stock</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 6: Shipping */}
          {currentStep === 5 && (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-black mb-2">Shipping</h2>
                <p className="text-gray-600">Configure shipping details for your product</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.shipping.weight}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      shipping: { ...prev.shipping, weight: Number(e.target.value) },
                    }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.shipping.dimensions.l}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      shipping: {
                        ...prev.shipping,
                        dimensions: { ...prev.shipping.dimensions, l: Number(e.target.value) },
                      },
                    }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.shipping.dimensions.w}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      shipping: {
                        ...prev.shipping,
                        dimensions: { ...prev.shipping.dimensions, w: Number(e.target.value) },
                      },
                    }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.shipping.dimensions.h}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      shipping: {
                        ...prev.shipping,
                        dimensions: { ...prev.shipping.dimensions, h: Number(e.target.value) },
                      },
                    }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.shipping.requiresShipping}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      shipping: { ...prev.shipping, requiresShipping: e.target.checked },
                    }))}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: '#87CEEB' }}
                  />
                  <div>
                    <p className="font-semibold text-black">Requires Shipping</p>
                    <p className="text-sm text-gray-500">This product needs to be shipped</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.shipping.digitalDownload}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      shipping: { ...prev.shipping, digitalDownload: e.target.checked },
                    }))}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: '#87CEEB' }}
                  />
                  <div>
                    <p className="font-semibold text-black">Digital Download</p>
                    <p className="text-sm text-gray-500">This is a digital product (no shipping required)</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 7: SEO */}
          {currentStep === 6 && (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-black mb-2">SEO Settings</h2>
                <p className="text-gray-600">Optimize your product for search engines</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.seo.metaTitle}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    seo: { ...prev.seo, metaTitle: e.target.value },
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                  onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  maxLength={70}
                  placeholder="SEO title for search engines"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.seo.metaTitle.length}/70 characters</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Meta Description
                </label>
                <textarea
                  value={formData.seo.metaDescription}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    seo: { ...prev.seo, metaDescription: e.target.value },
                  }))}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                  onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  maxLength={160}
                  placeholder="Brief description for search engine results"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.seo.metaDescription.length}/160 characters</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Custom URL Slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">/product/</span>
                  <input
                    type="text"
                    value={formData.seo.customSlug || formData.slug}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, customSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') },
                    }))}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors"
                    onFocus={(e) => e.target.style.borderColor = '#87CEEB'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    placeholder="custom-slug"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Review & Publish */}
          {currentStep === 7 && (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-black mb-2">Review & Publish</h2>
                <p className="text-gray-600">Review your product details and publish</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5DC' }}>
                  <h3 className="font-semibold text-black mb-2">Basic Info</h3>
                  <p className="text-sm text-gray-700"><strong>Title:</strong> {formData.title || 'Not set'}</p>
                  <p className="text-sm text-gray-700"><strong>Slug:</strong> {formData.slug || 'Not set'}</p>
                  <p className="text-sm text-gray-700"><strong>Category:</strong> {formData.category.path && Array.isArray(formData.category.path) ? formData.category.path.join(' > ') : 'Not set'}</p>
                  <p className="text-sm text-gray-700"><strong>Condition:</strong> {formData.condition}</p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5DC' }}>
                  <h3 className="font-semibold text-black mb-2">Media</h3>
                  <p className="text-sm text-gray-700">{formData.media.length} image(s) added</p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5DC' }}>
                  <h3 className="font-semibold text-black mb-2">Pricing</h3>
                  <p className="text-sm text-gray-700"><strong>Base Price:</strong> {formData.pricing.base.toLocaleString()} RWF</p>
                  {formData.pricing.compareAt > 0 && (
                    <p className="text-sm text-gray-700"><strong>Compare At:</strong> {formData.pricing.compareAt.toLocaleString()} RWF</p>
                  )}
                  <p className="text-sm text-gray-700"><strong>Bulk Tiers:</strong> {formData.pricing.bulkPricing.length} tier(s)</p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5DC' }}>
                  <h3 className="font-semibold text-black mb-2">Variants</h3>
                  <p className="text-sm text-gray-700">{formData.variants.length} variant(s) added</p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5DC' }}>
                  <h3 className="font-semibold text-black mb-2">Inventory</h3>
                  <p className="text-sm text-gray-700"><strong>Stock:</strong> {formData.inventory.totalStock}</p>
                  <p className="text-sm text-gray-700"><strong>Track Inventory:</strong> {formData.inventory.trackInventory ? 'Yes' : 'No'}</p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F5DC' }}>
                  <h3 className="font-semibold text-black mb-2">Shipping</h3>
                  <p className="text-sm text-gray-700"><strong>Weight:</strong> {formData.shipping.weight} kg</p>
                  <p className="text-sm text-gray-700"><strong>Requires Shipping:</strong> {formData.shipping.requiresShipping ? 'Yes' : 'No'}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Product Status
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {([
                      { value: 'draft', label: 'Draft', desc: 'Save without publishing' },
                      { value: 'active', label: 'Active', desc: 'Live and visible to buyers' },
                      { value: 'paused', label: 'Paused', desc: 'Temporarily hidden from search' },
                      { value: 'archived', label: 'Archived', desc: 'Permanently hidden' },
                    ] as const).map((status) => (
                      <label
                        key={status.value}
                        className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.status === status.value
                            ? 'border-black'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: formData.status === status.value ? '#F5F5DC' : undefined }}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={status.value}
                          checked={formData.status === status.value}
                          onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as typeof prev.status }))}
                          className="mt-1 w-4 h-4"
                          style={{ accentColor: '#87CEEB' }}
                        />
                        <div>
                          <p className="font-semibold text-black">{status.label}</p>
                          <p className="text-sm text-gray-500">{status.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              {STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep ? '' : index < currentStep ? 'bg-black' : 'bg-gray-300'
                  }`}
                  style={{ backgroundColor: index === currentStep ? '#87CEEB' : undefined }}
                />
              ))}
            </div>

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 text-black rounded-lg font-semibold transition-colors hover:opacity-90"
                style={{ backgroundColor: '#87CEEB' }}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 text-white rounded-lg font-semibold transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#000000' }}
              >
                {isSubmitting ? 'Publishing...' : 'Publish Product'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
