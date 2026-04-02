import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyToken, extractToken } from '@/lib/auth/middleware';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa';

let cachedConn: mongoose.Connection | null = null;

async function getDb() {
  if (cachedConn && cachedConn.readyState === 1) {
    return cachedConn;
  }
  
  const opts = {
    bufferCommands: false,
  };
  
  const conn = await mongoose.connect(MONGODB_URI, opts);
  cachedConn = conn.connection;
  return cachedConn;
}

// GET - Get all catalog items for user
export async function GET(request: Request) {
  try {
    const token = extractToken(request as any);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Build query
    const query: any = { userId };
    if (category) {
      query.category = category;
    }

    // Get catalog items with pagination
    const skip = (page - 1) * limit;
    const catalogItems = await db.collection('catalogItems')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count
    const totalItems = await db.collection('catalogItems').countDocuments(query);

    return NextResponse.json({
      success: true,
      catalogItems: catalogItems.map(item => ({
        id: item._id.toString(),
        name: item.name,
        description: item.description,
        price: item.price,
        currency: item.currency,
        category: item.category,
        images: item.images || [],
        inStock: item.inStock,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      pagination: {
        page,
        limit,
        total: totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });

  } catch (error) {
    console.error('Error getting catalog items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get catalog items' },
      { status: 500 }
    );
  }
}

// POST - Create new catalog item
export async function POST(request: Request) {
  try {
    const token = extractToken(request as any);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, price, currency, category, images, inStock } = body;

    if (!name || !price) {
      return NextResponse.json(
        { success: false, error: 'Name and price are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Create catalog item
    const result = await db.collection('catalogItems').insertOne({
      userId,
      name,
      description: description || '',
      price: parseFloat(price),
      currency: currency || 'RWF',
      category: category || 'General',
      images: images || [],
      inStock: inStock !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Catalog item created successfully',
      catalogItem: {
        id: result.insertedId.toString(),
        name,
        description: description || '',
        price: parseFloat(price),
        currency: currency || 'RWF',
        category: category || 'General',
        images: images || [],
        inStock: inStock !== false
      }
    });

  } catch (error) {
    console.error('Error creating catalog item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create catalog item' },
      { status: 500 }
    );
  }
}

// PUT - Update catalog item
export async function PUT(request: Request) {
  try {
    const token = extractToken(request as any);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, description, price, currency, category, images, inStock } = body;

    if (!id || !name || !price) {
      return NextResponse.json(
        { success: false, error: 'ID, name, and price are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const catalogItemId = new mongoose.Types.ObjectId(id);
    
    // Update catalog item
    await db.collection('catalogItems').updateOne(
      { _id: catalogItemId, userId },
      {
        $set: {
          name,
          description: description || '',
          price: parseFloat(price),
          currency: currency || 'RWF',
          category: category || 'General',
          images: images || [],
          inStock: inStock !== false,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Catalog item updated successfully'
    });

  } catch (error) {
    console.error('Error updating catalog item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update catalog item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete catalog item
export async function DELETE(request: Request) {
  try {
    const token = extractToken(request as any);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Catalog item ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const catalogItemId = new mongoose.Types.ObjectId(id);
    
    // Delete catalog item
    await db.collection('catalogItems').deleteOne({
      _id: catalogItemId,
      userId
    });

    return NextResponse.json({
      success: true,
      message: 'Catalog item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting catalog item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete catalog item' },
      { status: 500 }
    );
  }
}
