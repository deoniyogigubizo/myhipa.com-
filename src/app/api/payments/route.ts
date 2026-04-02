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

// GET - Get payment history
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
    const type = searchParams.get('type'); // 'sent' or 'received'

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Build query
    const query: any = {
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    };

    if (type === 'sent') {
      query.senderId = userId;
    } else if (type === 'received') {
      query.receiverId = userId;
    }

    // Get payments with pagination
    const skip = (page - 1) * limit;
    const payments = await db.collection('payments')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count
    const totalPayments = await db.collection('payments').countDocuments(query);

    // Enrich payments with user details
    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        const sender = await db.collection('users').findOne(
          { _id: payment.senderId },
          { projection: { _id: 1, 'profile.displayName': 1, 'profile.avatar': 1, email: 1 } }
        );

        const receiver = await db.collection('users').findOne(
          { _id: payment.receiverId },
          { projection: { _id: 1, 'profile.displayName': 1, 'profile.avatar': 1, email: 1 } }
        );

        return {
          id: payment._id.toString(),
          sender: sender ? {
            id: sender._id.toString(),
            name: sender.profile?.displayName || sender.email?.split('@')[0] || 'Unknown User',
            avatar: sender.profile?.avatar
          } : null,
          receiver: receiver ? {
            id: receiver._id.toString(),
            name: receiver.profile?.displayName || receiver.email?.split('@')[0] || 'Unknown User',
            avatar: receiver.profile?.avatar
          } : null,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          description: payment.description,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt
        };
      })
    );

    return NextResponse.json({
      success: true,
      payments: enrichedPayments,
      pagination: {
        page,
        limit,
        total: totalPayments,
        totalPages: Math.ceil(totalPayments / limit)
      }
    });

  } catch (error) {
    console.error('Error getting payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get payments' },
      { status: 500 }
    );
  }
}

// POST - Send payment
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
    const { receiverId, amount, currency, description } = body;

    if (!receiverId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Receiver ID and amount are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);
    
    // Check if receiver exists
    const receiver = await db.collection('users').findOne({
      _id: receiverObjectId
    });

    if (!receiver) {
      return NextResponse.json(
        { success: false, error: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Create payment
    const result = await db.collection('payments').insertOne({
      senderId: userId,
      receiverId: receiverObjectId,
      amount: parseFloat(amount),
      currency: currency || 'RWF',
      status: 'completed',
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Send payment notification message
    const conversation = await db.collection('conversations').findOne({
      participants: { $all: [userId, receiverObjectId] }
    });

    if (conversation) {
      // Create payment message
      await db.collection('messages').insertOne({
        conversationId: conversation._id,
        senderId: userId,
        content: `Sent ${currency || 'RWF'} ${amount}`,
        contentType: 'payment',
        payment: {
          id: result.insertedId.toString(),
          amount: parseFloat(amount),
          currency: currency || 'RWF',
          status: 'completed'
        },
        status: 'sent',
        sentAt: new Date(),
        readBy: [userId],
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update conversation last message
      await db.collection('conversations').updateOne(
        { _id: conversation._id },
        {
          $set: {
            lastMessage: {
              content: `Sent ${currency || 'RWF'} ${amount}`,
              senderId: userId,
              createdAt: new Date()
            },
            updatedAt: new Date()
          },
          $inc: {
            'unreadCount.$[elem].count': 1
          }
        },
        {
          arrayFilters: [{ 'elem.userId': receiverObjectId }]
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment sent successfully',
      payment: {
        id: result.insertedId.toString(),
        amount: parseFloat(amount),
        currency: currency || 'RWF',
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('Error sending payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send payment' },
      { status: 500 }
    );
  }
}
