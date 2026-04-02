import { NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { Product } from '@/lib/database/schemas/product.schema';


export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await connectDB();

    // Aggregate products by primary category
    const categoryStats = await Product.aggregate([
      {
        $match: {
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$category.primary',
          count: { $sum: 1 },
          totalPrice: { $sum: '$pricing.base' },
          minPrice: { $min: '$pricing.base' },
          maxPrice: { $max: '$pricing.base' },
          avgRating: { $avg: '$stats.avgRating' }
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          totalPrice: 1,
          minPrice: 1,
          maxPrice: 1,
          avgPrice: { $divide: ['$totalPrice', '$count'] },
          avgRating: { $round: ['$avgRating', 1] }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Define category metadata (using actual database category values)
    const categoryMetadata: Record<string, { name: string; icon: string; description: string; image: string }> = {
      'Electronics & Media': {
        name: 'Electronics & Media',
        icon: '📱',
        description: 'Phones, laptops, gadgets & more',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop'
      },
      'Fashion & Apparel': {
        name: 'Fashion & Apparel',
        icon: '👗',
        description: 'Clothing, shoes & accessories',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop'
      },
      'Home, Garden & Tools': {
        name: 'Home, Garden & Tools',
        icon: '🏠',
        description: 'Furniture, decor & essentials',
        image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop'
      },
      'Health, Beauty & Personal Care': {
        name: 'Health, Beauty & Personal Care',
        icon: '💄',
        description: 'Skincare, makeup & wellness',
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop'
      },
      'Sports, Outdoors & Travel': {
        name: 'Sports, Outdoors & Travel',
        icon: '⚽',
        description: 'Gear, equipment & activewear',
        image: 'https://images.unsplash.com/photo-1461896836934-b4e3eb6e9c4c?w=400&h=300&fit=crop'
      },
      'Automotive & Industrial': {
        name: 'Automotive & Industrial',
        icon: '🚗',
        description: 'Parts, accessories & services',
        image: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400&h=300&fit=crop'
      },
      'Groceries & Essentials': {
        name: 'Groceries & Essentials',
        icon: '🛒',
        description: 'Food, drinks & household items',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop'
      },
      'Digital Products': {
        name: 'Digital Products',
        icon: '💻',
        description: 'Software, e-books & online courses',
        image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop'
      },
      'Baby & Kids': {
        name: 'Baby & Kids',
        icon: '👶',
        description: 'Everything for little ones',
        image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&h=300&fit=crop'
      },
      'Pet Supplies': {
        name: 'Pet Supplies',
        icon: '🐾',
        description: 'Pet food, toys & accessories',
        image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop'
      },
      other: {
        name: 'Other',
        icon: '📦',
        description: 'Miscellaneous items',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop'
      }
    };

    // Map stats to categories
    const categoriesWithStats = categoryStats.map((stat) => {
      const meta = categoryMetadata[stat.category] || categoryMetadata['other'];
      return {
        id: stat.category,
        slug: stat.category,
        name: meta.name,
        icon: meta.icon,
        description: meta.description,
        image: meta.image,
        productCount: stat.count,
        totalPrice: Math.round(stat.totalPrice),
        avgPrice: Math.round(stat.avgPrice),
        minPrice: Math.round(stat.minPrice),
        maxPrice: Math.round(stat.maxPrice),
        avgRating: stat.avgRating
      };
    });

    // Add categories with zero products if they don't exist in stats
    const existingCategoryIds = new Set(categoriesWithStats.map(c => c.id));
    const allCategories = Object.entries(categoryMetadata)
      .filter(([id]) => !existingCategoryIds.has(id))
      .map(([id, meta]) => ({
        id,
        slug: id,
        name: meta.name,
        icon: meta.icon,
        description: meta.description,
        image: meta.image,
        productCount: 0,
        totalPrice: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        avgRating: 0
      }));

    const categories = [...categoriesWithStats, ...allCategories];

    return NextResponse.json({
      success: true,
      categories,
      totalProducts: categoryStats.reduce((sum, stat) => sum + stat.count, 0)
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
