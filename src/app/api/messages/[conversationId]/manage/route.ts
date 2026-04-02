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
    bufferCommands: false,
  };
  
  const conn = await mongoose.connect(MONGODB_URI, opts);
  cachedConn = conn.connection;
  return cachedConn;
}

// POST - Manage messages (delete, star, forward)
export async function POST(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
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

    const { conversationId } = params;
    const body = await request.json();
    const { action, messageIds, targetConversationIds } = body;

    if (!action || !messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json(
        { success: false, error: 'Action and message IDs are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);
    
    // Verify user is a participant in this conversation
    const conversation = await db.collection('conversations').findOne({
      _id: conversationObjectId,
      participants: userId
    });
    
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    const messageObjectIds = messageIds.map((id: string) => new mongoose.Types.ObjectId(id));

    switch (action) {
      case 'delete_for_me': {
        // Mark messages as deleted for this user
        await db.collection('messages').updateMany(
          {
            _id: { $in: messageObjectIds },
            conversationId: conversationObjectId
          },
          {
            $addToSet: { deletedFor: userId },
            $set: { updatedAt: new Date() }
          }
        );
        
        return NextResponse.json({
          success: true,
          message: 'Messages deleted for you'
        });
      }

      case 'delete_for_everyone': {
        // Check if messages are within 48 hours
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        
        const messages = await db.collection('messages').find({
          _id: { $in: messageObjectIds },
          conversationId: conversationObjectId,
          senderId: userId,
          createdAt: { $gte: fortyEightHoursAgo }
        }).toArray();

        if (messages.length !== messageIds.length) {
          return NextResponse.json(
            { success: false, error: 'Can only delete your own messages within 48 hours' },
            { status: 400 }
          );
        }

        // Mark messages as deleted for everyone
        await db.collection('messages').updateMany(
          {
            _id: { $in: messageObjectIds },
            conversationId: conversationObjectId
          },
          {
            $set: {
              deleted: true,
              deletedAt: new Date(),
              updatedAt: new Date()
            }
          }
        );

        // Broadcast deletion to all participants
        const otherParticipants = conversation.participants.filter(
          (p: mongoose.Types.ObjectId) => p.toString() !== user.userId
        );

        for (const participantId of otherParticipants) {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/messages/ws`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'message_deleted',
              conversationId,
              recipientId: participantId.toString(),
              data: {
                messageIds
              }
            }),
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Messages deleted for everyone'
        });
      }

      case 'star': {
        // Toggle star status for messages
        const messages = await db.collection('messages').find({
          _id: { $in: messageObjectIds },
          conversationId: conversationObjectId
        }).toArray();

        for (const message of messages) {
          const starredBy = message.starredBy || [];
          const isStarred = starredBy.some((id: mongoose.Types.ObjectId) => id.toString() === user.userId);

          if (isStarred) {
            // Unstar
            await db.collection('messages').updateOne(
              { _id: message._id },
              {
                $pull: { starredBy: userId } as any,
                $set: { updatedAt: new Date() }
              }
            );
          } else {
            // Star
            await db.collection('messages').updateOne(
              { _id: message._id },
              {
                $addToSet: { starredBy: userId },
                $set: { updatedAt: new Date() }
              }
            );
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Messages starred/unstarred'
        });
      }

      case 'forward': {
        if (!targetConversationIds || !Array.isArray(targetConversationIds)) {
          return NextResponse.json(
            { success: false, error: 'Target conversation IDs are required' },
            { status: 400 }
          );
        }

        // Limit to 5 chats to prevent spam
        if (targetConversationIds.length > 5) {
          return NextResponse.json(
            { success: false, error: 'Can forward to maximum 5 chats at once' },
            { status: 400 }
          );
        }

        // Get messages to forward
        const messagesToForward = await db.collection('messages').find({
          _id: { $in: messageObjectIds },
          conversationId: conversationObjectId,
          deleted: false
        }).toArray();

        // Forward each message to each target conversation
        for (const targetConvId of targetConversationIds) {
          const targetConvObjectId = new mongoose.Types.ObjectId(targetConvId);
          
          // Verify user is participant in target conversation
          const targetConv = await db.collection('conversations').findOne({
            _id: targetConvObjectId,
            participants: userId
          });

          if (!targetConv) continue;

          for (const message of messagesToForward) {
            const forwardedMessage = {
              conversationId: targetConvObjectId,
              senderId: userId,
              content: message.content,
              contentType: message.contentType,
              imageUrl: message.imageUrl,
              videoUrl: message.videoUrl,
              audioUrl: message.audioUrl,
              documentUrl: message.documentUrl,
              documentName: message.documentName,
              location: message.location,
              contact: message.contact,
              forwardedFrom: {
                messageId: message._id.toString(),
                conversationId: conversationId,
                senderId: message.senderId.toString()
              },
              status: 'sent',
              sentAt: new Date(),
              readBy: [userId],
              deleted: false,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            await db.collection('messages').insertOne(forwardedMessage);

            // Update conversation last message
            await db.collection('conversations').updateOne(
              { _id: targetConvObjectId },
              {
                $set: {
                  lastMessage: {
                    content: message.content || 'Forwarded message',
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
                arrayFilters: [{ 'elem.userId': { $ne: userId } }]
              }
            );
          }
        }

        return NextResponse.json({
          success: true,
          message: `Messages forwarded to ${targetConversationIds.length} chat(s)`
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error managing messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage messages' },
      { status: 500 }
    );
  }
}

// GET - Search messages in conversation
export async function GET(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
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

    const { conversationId } = params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);
    
    // Verify user is a participant in this conversation
    const conversation = await db.collection('conversations').findOne({
      _id: conversationObjectId,
      participants: userId
    });
    
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Search messages
    const skip = (page - 1) * limit;
    const messages = await db.collection('messages')
      .find({
        conversationId: conversationObjectId,
        deleted: false,
        content: { $regex: query, $options: 'i' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count
    const totalMessages = await db.collection('messages').countDocuments({
      conversationId: conversationObjectId,
      deleted: false,
      content: { $regex: query, $options: 'i' }
    });

    // Enrich messages with sender details
    const enrichedMessages = await Promise.all(
      messages.map(async (msg: any) => {
        const sender = await db.collection('users').findOne(
          { _id: msg.senderId },
          { projection: { _id: 1, 'profile.displayName': 1, 'profile.avatar': 1, email: 1 } }
        );

        return {
          id: msg._id.toString(),
          sender: sender ? {
            id: sender._id.toString(),
            name: sender.profile?.displayName || sender.email?.split('@')[0] || 'Unknown User',
            avatar: sender.profile?.avatar
          } : null,
          content: msg.content,
          contentType: msg.contentType,
          createdAt: msg.createdAt
        };
      })
    );

    return NextResponse.json({
      success: true,
      messages: enrichedMessages,
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit)
      }
    });

  } catch (error) {
    console.error('Error searching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search messages' },
      { status: 500 }
    );
  }
}
