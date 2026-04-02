import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyToken } from '@/lib/auth/middleware';


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

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>();

// GET - Server-Sent Events endpoint for real-time updates
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.json(
      { error: 'Token required' },
      { status: 401 }
    );
  }
  
  const user = verifyToken(token);
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
  
  const userId = user.userId;
  
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Store the connection
      connections.set(userId, controller);
      
      // Send initial connection message
      const data = JSON.stringify({
        type: 'connected',
        userId,
        timestamp: new Date().toISOString()
      });
      
      controller.enqueue(`data: ${data}\n\n`);
      
      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
        } catch (e) {
          clearInterval(heartbeat);
          connections.delete(userId);
        }
      }, 30000);
    },
    
    cancel() {
      connections.delete(userId);
    }
  });
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// POST - Send events to connected clients
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, conversationId, recipientId, data } = body;
    
    const db = await getDb();
    
    switch (type) {
      case 'new_message': {
        // Get the message and sender details
        const message = await db.collection('messages').findOne({
          _id: new mongoose.Types.ObjectId(data.messageId)
        });
        
        if (!message) {
          return NextResponse.json(
            { error: 'Message not found' },
            { status: 404 }
          );
        }
        
        const sender = await db.collection('users').findOne(
          { _id: message.senderId },
          { projection: { _id: 1, 'profile.displayName': 1, 'profile.avatar': 1, email: 1 } }
        );
        
        // Send to recipient if connected
        const recipientController = connections.get(recipientId);
        if (recipientController) {
          const eventData = JSON.stringify({
            type: 'new_message',
            conversationId,
            message: {
              id: message._id.toString(),
              sender: sender ? {
                id: sender._id.toString(),
                name: sender.profile?.displayName || sender.email?.split('@')[0] || 'Unknown User',
                avatar: sender.profile?.avatar
              } : null,
              content: message.content,
              contentType: message.contentType,
              imageUrl: message.imageUrl,
              createdAt: message.createdAt
            },
            timestamp: new Date().toISOString()
          });
          
          try {
            recipientController.enqueue(`data: ${eventData}\n\n`);
          } catch (e) {
            connections.delete(recipientId);
          }
        }
        
        break;
      }
      
      case 'typing': {
        // Send typing indicator to recipient
        const recipientController = connections.get(recipientId);
        if (recipientController) {
          const eventData = JSON.stringify({
            type: 'typing',
            conversationId,
            userId: data.userId,
            isTyping: data.isTyping,
            timestamp: new Date().toISOString()
          });
          
          try {
            recipientController.enqueue(`data: ${eventData}\n\n`);
          } catch (e) {
            connections.delete(recipientId);
          }
        }
        
        break;
      }
      
      case 'read_receipt': {
        // Send read receipt to sender
        const senderController = connections.get(recipientId);
        if (senderController) {
          const eventData = JSON.stringify({
            type: 'read_receipt',
            conversationId,
            messageIds: data.messageIds,
            readBy: data.readBy,
            timestamp: new Date().toISOString()
          });
          
          try {
            senderController.enqueue(`data: ${eventData}\n\n`);
          } catch (e) {
            connections.delete(recipientId);
          }
        }
        
        break;
      }
      
      case 'message_edited': {
        // Send message edited event to recipient
        const recipientController = connections.get(recipientId);
        if (recipientController) {
          const eventData = JSON.stringify({
            type: 'message_edited',
            conversationId,
            messageId: data.messageId,
            content: data.content,
            editedAt: data.editedAt,
            timestamp: new Date().toISOString()
          });
          
          try {
            recipientController.enqueue(`data: ${eventData}\n\n`);
          } catch (e) {
            connections.delete(recipientId);
          }
        }
        
        break;
      }
      
      case 'message_deleted': {
        // Send message deleted event to recipient
        const recipientController = connections.get(recipientId);
        if (recipientController) {
          const eventData = JSON.stringify({
            type: 'message_deleted',
            conversationId,
            messageId: data.messageId,
            timestamp: new Date().toISOString()
          });
          
          try {
            recipientController.enqueue(`data: ${eventData}\n\n`);
          } catch (e) {
            connections.delete(recipientId);
          }
        }
        
        break;
      }
      
      case 'message_status': {
        // Update message status in database
        const db = await getDb();
        const messageObjectId = new mongoose.Types.ObjectId(data.messageId);
        
        const updateData: any = {
          status: data.status,
          updatedAt: new Date()
        };
        
        if (data.status === 'delivered') {
          updateData.deliveredAt = new Date();
        } else if (data.status === 'read') {
          updateData.readAt = new Date();
        }
        
        await db.collection('messages').updateOne(
          { _id: messageObjectId },
          { $set: updateData }
        );
        
        // Send status update to sender
        const senderController = connections.get(recipientId);
        if (senderController) {
          const eventData = JSON.stringify({
            type: 'message_status',
            conversationId,
            messageId: data.messageId,
            status: data.status,
            timestamp: new Date().toISOString()
          });
          
          try {
            senderController.enqueue(`data: ${eventData}\n\n`);
          } catch (e) {
            connections.delete(recipientId);
          }
        }
        
        break;
      }
      
      default:
        return NextResponse.json(
          { error: 'Unknown event type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error sending event:', error);
    return NextResponse.json(
      { error: 'Failed to send event' },
      { status: 500 }
    );
  }
}
