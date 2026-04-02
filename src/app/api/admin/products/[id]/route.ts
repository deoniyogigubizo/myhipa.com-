import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/mongodb";
import { Product } from "@/lib/database/schemas";
import {
  withSuperAdminAuth,
  type AuthenticatedRequest,
} from "@/lib/auth/middleware";


export const dynamic = "force-dynamic";
async function getProduct(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    const product = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: product._id?.toString(),
        sellerId: product.sellerId?.toString(),
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
        stats: product.stats,
        tags: product.tags,
        condition: product.condition,
        status: product.status,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

async function updateProduct(request: AuthenticatedRequest) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();
    const body = await request.json();

    const { _id, ...updateData } = body;

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: product._id?.toString(),
        title: product.title,
        status: product.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export const GET = withSuperAdminAuth(getProduct);
export const PUT = withSuperAdminAuth(updateProduct);
