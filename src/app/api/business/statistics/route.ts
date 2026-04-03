import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyToken, extractToken } from '@/lib/auth/middleware';


export const dynamic = "force-dynamic";
// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa';

let cachedConn: mongoose.Connection | null = null;

async function getDb() {
  if (cachedConn && cachedConn.readyState === 1) {
    return cachedConn;
  }
  
  const opts = {
    bufferCommands: true,
  };
  
  const conn = await mongoose.connect(MONGODB_URI, opts);
  cachedConn = conn.connection;
  return cachedConn;
}

// GET - Get business statistics
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
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d, 1y

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get total conversations
    const totalConversations = await db.collection('conversations').countDocuments({
      participants: userId
    });

    // Get conversations in period
    const periodConversations = await db.collection('conversations').countDocuments({
      participants: userId,
      createdAt: { $gte: startDate }
    });

    // Get total messages sent
    const totalMessagesSent = await db.collection('messages').countDocuments({
      senderId: userId,
      deleted: false
    });

    // Get messages sent in period
    const periodMessagesSent = await db.collection('messages').countDocuments({
      senderId: userId,
      deleted: false,
      createdAt: { $gte: startDate }
    });

    // Get total messages received
    const conversations = await db.collection('conversations').find({
      participants: userId
    }).toArray();

    let totalMessagesReceived = 0;
    let periodMessagesReceived = 0;

    for (const conv of conversations) {
      const receivedCount = await db.collection('messages').countDocuments({
        conversationId: conv._id,
        senderId: { $ne: userId },
        deleted: false
      });
      totalMessagesReceived += receivedCount;

      const periodReceivedCount = await db.collection('messages').countDocuments({
        conversationId: conv._id,
        senderId: { $ne: userId },
        deleted: false,
        createdAt: { $gte: startDate }
      });
      periodMessagesReceived += periodReceivedCount;
    }

    // Get average response time (in minutes)
    const messages = await db.collection('messages').find({
      senderId: userId,
      deleted: false,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 }).toArray();

    let totalResponseTime = 0;
    let responseCount = 0;

    for (const message of messages) {
      // Find previous message in conversation from other participant
      const previousMessage = await db.collection('messages').findOne({
        conversationId: message.conversationId,
        senderId: { $ne: userId },
        deleted: false,
        createdAt: { $lt: message.createdAt }
      }, { sort: { createdAt: -1 } });

      if (previousMessage) {
        const responseTime = (message.createdAt.getTime() - previousMessage.createdAt.getTime()) / (1000 * 60);
        totalResponseTime += responseTime;
        responseCount++;
      }
    }

    const averageResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;

    // Get most active hours
    const hourlyStats = await db.collection('messages').aggregate([
      {
        $match: {
          senderId: userId,
          deleted: false,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]).toArray();

    // Get most active days
    const dailyStats = await db.collection('messages').aggregate([
      {
        $match: {
          senderId: userId,
          deleted: false,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();

    // Get media statistics
    const mediaStats = await db.collection('messages').aggregate([
      {
        $match: {
          senderId: userId,
          deleted: false,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$contentType',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get catalog statistics
    const totalCatalogItems = await db.collection('catalogItems').countDocuments({
      userId
    });

    const inStockItems = await db.collection('catalogItems').countDocuments({
      userId,
      inStock: true
    });

    return NextResponse.json({
      success: true,
      statistics: {
        period,
        conversations: {
          total: totalConversations,
          period: periodConversations
        },
        messages: {
          sent: {
            total: totalMessagesSent,
            period: periodMessagesSent
          },
          received: {
            total: totalMessagesReceived,
            period: periodMessagesReceived
          }
        },
        responseTime: {
          averageMinutes: averageResponseTime
        },
        activity: {
          hourly: hourlyStats.map(h => ({
            hour: h._id,
            count: h.count
          })),
          daily: dailyStats.map(d => ({
            day: d._id,
            count: d.count
          }))
        },
        media: mediaStats.map(m => ({
          type: m._id,
          count: m.count
        })),
        catalog: {
          total: totalCatalogItems,
          inStock: inStockItems,
          outOfStock: totalCatalogItems - inStockItems
        }
      }
    });

  } catch (error) {
    console.error('Error getting business statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get business statistics' },
      { status: 500 }
    );
  }
}
