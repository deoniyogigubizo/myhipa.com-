import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/database/mongodb';
import { Product, Seller, AuditLog } from '@/lib/database/schemas';
import { withSellerAuth } from '@/lib/auth/middleware';


export const dynamic = "force-dynamic";
export const GET = withSellerAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    
    const user = (request as any).user;
    // Convert userId string to ObjectId for proper MongoDB query
    const userId = new mongoose.Types.ObjectId(user.userId);
    const seller = await Seller.findOne({ userId });
    
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const filter = searchParams.get('filter');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const query: any = { sellerId: seller._id };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (filter === 'low-stock') {
      query['inventory.trackInventory'] = true;
      query.$expr = { $lte: ['$inventory.totalStock', '$inventory.lowStockThreshold'] };
      query['inventory.totalStock'] = { $gt: 0 };
    } else if (filter === 'out-of-stock') {
      query['inventory.trackInventory'] = true;
      query['inventory.totalStock'] = 0;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query)
    ]);

    return NextResponse.json({
      products: products.map(product => ({
        id: product._id,
        title: product.title,
        slug: product.slug,
        description: product.description,
        category: product.category,
        media: product.media,
        pricing: product.pricing,
        variants: product.variants,
        inventory: product.inventory,
        shipping: product.shipping,
        seo: product.seo,
        tags: product.tags,
        condition: product.condition,
        status: product.status,
        stats: product.stats,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Seller products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withSellerAuth(async (request: NextRequest) => {
  try {
    await connectDB();
    
    const user = (request as any).user;
    // Convert userId string to ObjectId for proper MongoDB query
    const userId = new mongoose.Types.ObjectId(user.userId);
    const seller = await Seller.findOne({ userId });
    
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.category?.primary || !body.pricing?.base) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category.primary, pricing.base' },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check for duplicate slug
    const existingProduct = await Product.findOne({ slug, sellerId: { $ne: seller._id } });
    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this slug already exists' },
        { status: 400 }
      );
    }

    // Calculate total stock from variants if variants exist
    let totalStock = body.inventory?.totalStock || 0;
    if (body.variants && body.variants.length > 0) {
      totalStock = body.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
    }

    const product = new Product({
      sellerId: seller._id,
      title: body.title,
      slug: slug,
      description: body.description,
      category: {
        primary: body.category.primary,
        secondary: body.category.secondary || undefined,
        tertiary: body.category.tertiary || undefined,
        path: body.category.path || [body.category.primary, body.category.secondary, body.category.tertiary].filter(Boolean)
      },
      media: body.media || [],
      pricing: {
        base: body.pricing.base,
        compareAt: body.pricing.compareAt || undefined,
        currency: body.pricing.currency || 'RWF',
        bulkPricing: body.pricing.bulkPricing || []
      },
      variants: body.variants || [],
      inventory: {
        totalStock: totalStock,
        lowStockThreshold: body.inventory?.lowStockThreshold ?? 3,
        trackInventory: body.inventory?.trackInventory ?? true,
        allowBackorder: body.inventory?.allowBackorder ?? false
      },
      shipping: {
        weight: body.shipping?.weight || 0,
        dimensions: body.shipping?.dimensions || undefined,
        requiresShipping: body.shipping?.requiresShipping ?? true,
        digitalDownload: body.shipping?.digitalDownload ?? false
      },
      seo: {
        metaTitle: body.seo?.metaTitle || undefined,
        metaDescription: body.seo?.metaDescription || undefined,
        customSlug: body.seo?.customSlug || undefined
      },
      tags: body.tags || [],
      condition: body.condition || 'new',
      status: body.status || 'draft',
      stats: {
        views: 0,
        addedToCart: 0,
        purchased: 0,
        conversionRate: 0,
        avgRating: 0,
        reviewCount: 0,
        wishlistCount: 0
      }
    });

    await product.save();

    // Update seller stats
    seller.stats.productCount = await Product.countDocuments({ sellerId: seller._id, status: 'active' });
    await seller.save();

    // Log product creation activity
    try {
      await (AuditLog as any).log({
        actor: {
          userId: user.userId,
          role: user.role || 'seller',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        },
        action: 'product_created',
        entity: {
          type: 'product',
          id: product._id
        },
        metadata: {
          productSlug: product.slug,
          category: product.category.primary,
          price: product.pricing.base,
          status: product.status
        }
      });
    } catch (logError) {
      console.error('Error logging product creation:', logError);
    }

    return NextResponse.json({
      product: {
        id: product._id,
        title: product.title,
        slug: product.slug,
        status: product.status
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A product with this slug already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
});
