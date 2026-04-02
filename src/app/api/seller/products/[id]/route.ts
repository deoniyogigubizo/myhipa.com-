import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/database/mongodb';
import { Product, Seller } from '@/lib/database/schemas';
import { withSellerAuth } from '@/lib/auth/middleware';

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

    // Extract id from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const product = await Product.findOne({ _id: id, sellerId: seller._id });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      product: {
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
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PUT = withSellerAuth(async (request: NextRequest) => {
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

    // Extract id from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const product = await Product.findOne({ _id: id, sellerId: seller._id });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Update product fields
    if (body.title) product.title = body.title;
    if (body.slug) product.slug = body.slug;
    if (body.description) product.description = body.description;
    if (body.category) {
      product.category = {
        primary: body.category.primary || product.category.primary,
        secondary: body.category.secondary || product.category.secondary,
        tertiary: body.category.tertiary || product.category.tertiary,
        path: body.category.path || product.category.path
      };
    }
    if (body.media) product.media = body.media;
    if (body.pricing) {
      product.pricing = {
        base: body.pricing.base || product.pricing.base,
        compareAt: body.pricing.compareAt || product.pricing.compareAt,
        currency: body.pricing.currency || product.pricing.currency,
        bulkPricing: body.pricing.bulkPricing || product.pricing.bulkPricing
      };
    }
    if (body.variants) product.variants = body.variants;
    if (body.inventory) {
      product.inventory = {
        totalStock: body.inventory.totalStock ?? product.inventory.totalStock,
        lowStockThreshold: body.inventory.lowStockThreshold ?? product.inventory.lowStockThreshold,
        trackInventory: body.inventory.trackInventory ?? product.inventory.trackInventory,
        allowBackorder: body.inventory.allowBackorder ?? product.inventory.allowBackorder
      };
    }
    if (body.shipping) {
      product.shipping = {
        weight: body.shipping.weight ?? product.shipping.weight,
        dimensions: body.shipping.dimensions || product.shipping.dimensions,
        requiresShipping: body.shipping.requiresShipping ?? product.shipping.requiresShipping,
        digitalDownload: body.shipping.digitalDownload ?? product.shipping.digitalDownload
      };
    }
    if (body.seo) {
      product.seo = {
        metaTitle: body.seo.metaTitle || product.seo.metaTitle,
        metaDescription: body.seo.metaDescription || product.seo.metaDescription,
        customSlug: body.seo.customSlug || product.seo.customSlug
      };
    }
    if (body.tags) product.tags = body.tags;
    if (body.condition) product.condition = body.condition;
    if (body.status) product.status = body.status;

    await product.save();

    return NextResponse.json({
      product: {
        id: product._id,
        title: product.title,
        slug: product.slug,
        status: product.status
      }
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    
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

export const DELETE = withSellerAuth(async (request: NextRequest) => {
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

    // Extract id from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const product = await Product.findOne({ _id: id, sellerId: seller._id });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    await Product.deleteOne({ _id: id });

    // Update seller stats
    seller.stats.productCount = await Product.countDocuments({ sellerId: seller._id, status: 'active' });
    await seller.save();

    return NextResponse.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
