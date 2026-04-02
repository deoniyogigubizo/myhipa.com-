import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { verifyToken, extractToken } from "@/lib/auth/middleware";
import {
  encryptMessage,
  decryptMessage,
  encryptSymmetricKey,
  decryptSymmetricKey,
  generateSymmetricKey,
} from "@/lib/encryption";
import { AuditLog } from "@/lib/database/schemas";


export const dynamic = "force-dynamic";
// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa";

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

// GET - Get messages for a conversation
export async function GET(
  request: Request,
  { params }: { params: { conversationId: string } },
) {
  try {
    const token = extractToken(request as any);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    const { conversationId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);

    // Verify user is a participant in this conversation
    const conversation = await db.collection("conversations").findOne({
      _id: conversationObjectId,
      participants: userId,
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found or access denied" },
        { status: 404 },
      );
    }

    // Get messages with pagination
    const skip = (page - 1) * limit;
    const messages = await db
      .collection("messages")
      .find({
        conversationId: conversationObjectId,
        deleted: false,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Mark messages as read by current user
    const unreadMessages = messages.filter(
      (msg: any) => !msg.readBy?.includes(userId),
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((msg: any) => msg._id);
      await db
        .collection("messages")
        .updateMany(
          { _id: { $in: messageIds } },
          { $addToSet: { readBy: userId } },
        );

      // Reset unread count for this user
      await db.collection("conversations").updateOne(
        { _id: conversationObjectId },
        {
          $set: {
            "unreadCount.$[elem].count": 0,
          },
        },
        {
          arrayFilters: [{ "elem.userId": userId }],
        },
      );
    }

    // Enrich messages with sender details
    const enrichedMessages = await Promise.all(
      messages.map(async (msg: any) => {
        let sender = await db.collection("users").findOne(
          { _id: msg.senderId },
          {
            projection: {
              _id: 1,
              "profile.displayName": 1,
              "profile.avatar": 1,
              email: 1,
              name: 1,
            },
          },
        );

        // If not found in users, try resolving as seller ID
        if (!sender) {
          const sellerDoc = await db
            .collection("sellers")
            .findOne(
              { _id: msg.senderId },
              { projection: { userId: 1, "store.name": 1 } },
            );
          if (sellerDoc?.userId) {
            sender = await db.collection("users").findOne(
              { _id: sellerDoc.userId },
              {
                projection: {
                  _id: 1,
                  "profile.displayName": 1,
                  "profile.avatar": 1,
                  email: 1,
                  name: 1,
                },
              },
            );
          }
        }

        let product = null;
        if (msg.productId) {
          product = await db.collection("products").findOne(
            { _id: msg.productId },
            {
              projection: { _id: 1, title: 1, price: 1, images: 1, slug: 1 },
            },
          );
        }

        let order = null;
        if (msg.orderId) {
          order = await db
            .collection("orders")
            .findOne(
              { _id: msg.orderId },
              { projection: { _id: 1, orderNumber: 1, status: 1, total: 1 } },
            );
        }

        // Decrypt message if encrypted
        let decryptedContent = msg.content;
        if (msg.encrypted && msg.encryptedSymmetricKey && msg.encryptionIv) {
          try {
            // Get current user's private key to decrypt symmetric key
            const currentUser = await db
              .collection("users")
              .findOne({ _id: userId }, { projection: { privateKey: 1 } });

            if (currentUser?.privateKey) {
              // Decrypt symmetric key
              const symmetricKey = decryptSymmetricKey(
                msg.encryptedSymmetricKey,
                currentUser.privateKey,
              );

              // Decrypt message content
              decryptedContent = decryptMessage(
                { iv: msg.encryptionIv, encrypted: msg.content },
                symmetricKey,
              );
            }
          } catch (decryptError) {
            console.error("Error decrypting message:", decryptError);
            decryptedContent = "[Encrypted message]";
          }
        }

        return {
          id: msg._id.toString(),
          sender: sender
            ? {
                id: sender._id.toString(),
                name:
                  sender.profile?.displayName ||
                  sender.name ||
                  sender.email?.split("@")[0] ||
                  "Unknown User",
                avatar: sender.profile?.avatar,
              }
            : null,
          content: decryptedContent,
          contentType: msg.contentType,
          imageUrl: msg.imageUrl,
          videoUrl: msg.videoUrl,
          audioUrl: msg.audioUrl,
          documentUrl: msg.documentUrl,
          documentName: msg.documentName,
          location: msg.location,
          contact: msg.contact,
          product: product
            ? {
                id: product._id.toString(),
                title: product.title,
                price: product.price,
                image: product.images?.[0],
                slug: product.slug,
              }
            : null,
          order: order
            ? {
                id: order._id.toString(),
                orderNumber: order.orderNumber,
                status: order.status,
                total: order.total,
              }
            : null,
          replyTo: msg.replyTo,
          encrypted: msg.encrypted || false,
          status: msg.status || "sent",
          sentAt: msg.sentAt,
          deliveredAt: msg.deliveredAt,
          readAt: msg.readAt,
          readBy:
            msg.readBy?.map((id: mongoose.Types.ObjectId) => id.toString()) ||
            [],
          editedAt: msg.editedAt,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
        };
      }),
    );

    // Get total count for pagination
    const totalMessages = await db.collection("messages").countDocuments({
      conversationId: conversationObjectId,
      deleted: false,
    });

    // Get other participant details
    const otherParticipantId = conversation.participants.find(
      (p: mongoose.Types.ObjectId) => p.toString() !== user.userId,
    );

    let otherParticipant = null;
    if (otherParticipantId) {
      let participant = await db.collection("users").findOne(
        { _id: otherParticipantId },
        {
          projection: {
            _id: 1,
            "profile.displayName": 1,
            "profile.avatar": 1,
            email: 1,
            name: 1,
          },
        },
      );

      // If not found in users, try resolving as seller ID
      if (!participant) {
        const sellerDoc = await db
          .collection("sellers")
          .findOne(
            { _id: otherParticipantId },
            { projection: { userId: 1, "store.name": 1, "store.slug": 1 } },
          );
        if (sellerDoc?.userId) {
          participant = await db.collection("users").findOne(
            { _id: sellerDoc.userId },
            {
              projection: {
                _id: 1,
                "profile.displayName": 1,
                "profile.avatar": 1,
                email: 1,
                name: 1,
              },
            },
          );
        }
        // If still not found, use seller store name as fallback
        if (!participant && sellerDoc) {
          participant = {
            _id: otherParticipantId,
            name: sellerDoc.store?.name || "Unknown Seller",
            profile: { avatar: undefined },
            email: undefined,
          };
        }
      }

      if (participant) {
        otherParticipant = {
          id: participant._id.toString(),
          name:
            participant.profile?.displayName ||
            participant.name ||
            participant.email?.split("@")[0] ||
            "Unknown User",
          avatar: participant.profile?.avatar || "",
          email: participant.email,
        };
      }
    }

    return NextResponse.json({
      success: true,
      conversation: {
        _id: conversation._id.toString(),
        otherParticipant,
        lastMessage: conversation.lastMessage,
        unreadCount: conversation.unreadCount,
        productId: conversation.productId?.toString(),
        orderId: conversation.orderId?.toString(),
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages: enrichedMessages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

// POST - Send a new message
export async function POST(
  request: Request,
  { params }: { params: { conversationId: string } },
) {
  try {
    const token = extractToken(request as any);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    const { conversationId } = params;
    const body = await request.json();
    const {
      content,
      contentType = "text",
      productId,
      orderId,
      imageUrl,
      videoUrl,
      audioUrl,
      documentUrl,
      documentName,
      location,
      contact,
      replyToId,
    } = body;

    if (
      !content &&
      !imageUrl &&
      !videoUrl &&
      !audioUrl &&
      !documentUrl &&
      !location &&
      !contact
    ) {
      return NextResponse.json(
        { success: false, error: "Message content is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);

    // Verify user is a participant in this conversation
    const conversation = await db.collection("conversations").findOne({
      _id: conversationObjectId,
      participants: userId,
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found or access denied" },
        { status: 404 },
      );
    }

    // Get replyTo message if provided
    let replyTo = null;
    if (replyToId) {
      const replyToMessage = await db
        .collection("messages")
        .findOne(
          { _id: new mongoose.Types.ObjectId(replyToId) },
          { projection: { content: 1, senderId: 1 } },
        );
      if (replyToMessage) {
        const replyToSender = await db
          .collection("users")
          .findOne(
            { _id: replyToMessage.senderId },
            { projection: { "profile.displayName": 1, email: 1 } },
          );
        replyTo = {
          id: replyToMessage._id.toString(),
          content: replyToMessage.content,
          senderName:
            replyToSender?.profile?.displayName ||
            replyToSender?.email?.split("@")[0] ||
            "Unknown",
        };
      }
    }

    // Check if encryption is enabled for this conversation
    const conversationForEncryption = await db
      .collection("conversations")
      .findOne({
        _id: conversationObjectId,
      });

    let encryptedContent = content || "";
    let encryptedSymmetricKey = null;
    let encryptionIv = null;

    // Encrypt message if encryption is enabled
    if (conversationForEncryption?.encryptionEnabled) {
      // Get recipient's public key
      const otherParticipantId = conversation.participants.find(
        (p: mongoose.Types.ObjectId) => p.toString() !== user.userId,
      );

      if (otherParticipantId) {
        const recipient = await db
          .collection("users")
          .findOne(
            { _id: otherParticipantId },
            { projection: { publicKey: 1 } },
          );

        if (recipient?.publicKey) {
          // Generate symmetric key for this message
          const symmetricKey = generateSymmetricKey();

          // Encrypt the message content
          const encrypted = encryptMessage(content || "", symmetricKey);
          encryptedContent = encrypted.encrypted;
          encryptionIv = encrypted.iv;

          // Encrypt symmetric key with recipient's public key
          encryptedSymmetricKey = encryptSymmetricKey(
            symmetricKey,
            recipient.publicKey,
          );
        }
      }
    }

    // Create new message
    const newMessage = {
      conversationId: conversationObjectId,
      senderId: userId,
      content: encryptedContent,
      contentType,
      productId: productId ? new mongoose.Types.ObjectId(productId) : undefined,
      orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
      imageUrl,
      videoUrl,
      audioUrl,
      documentUrl,
      documentName,
      location,
      contact,
      replyTo,
      encrypted: conversationForEncryption?.encryptionEnabled || false,
      encryptedSymmetricKey,
      encryptionIv,
      status: "sent",
      sentAt: new Date(),
      readBy: [userId],
      deleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("messages").insertOne(newMessage);

    // Update conversation with last message and increment unread count for other participants
    const otherParticipants = conversation.participants.filter(
      (p: mongoose.Types.ObjectId) => p.toString() !== user.userId,
    );

    await db.collection("conversations").updateOne(
      { _id: conversationObjectId },
      {
        $set: {
          lastMessage: {
            content: content || "Sent an image",
            senderId: userId,
            createdAt: new Date(),
          },
          updatedAt: new Date(),
        },
        $inc: {
          "unreadCount.$[elem].count": 1,
        },
      },
      {
        arrayFilters: [{ "elem.userId": { $in: otherParticipants } }],
      },
    );

    // Get sender details for response
    const sender = await db.collection("users").findOne(
      { _id: userId },
      {
        projection: {
          _id: 1,
          "profile.displayName": 1,
          "profile.avatar": 1,
          email: 1,
        },
      },
    );

    // Log message sent activity
    try {
      await (AuditLog as any).log({
        actor: {
          userId: user.userId,
          role: user.role || "user",
          ip:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
        action: "message_sent",
        entity: {
          type: "conversation",
          id: conversationObjectId,
        },
        metadata: {
          messageId: result.insertedId.toString(),
          contentType: newMessage.contentType,
          hasImage: !!newMessage.imageUrl,
          hasVideo: !!newMessage.videoUrl,
          hasAudio: !!newMessage.audioUrl,
          hasDocument: !!newMessage.documentUrl,
          hasLocation: !!newMessage.location,
          hasContact: !!newMessage.contact,
          productId: newMessage.productId?.toString(),
          orderId: newMessage.orderId?.toString(),
        },
      });
    } catch (logError) {
      console.error("Error logging message activity:", logError);
    }

    return NextResponse.json({
      success: true,
      message: {
        id: result.insertedId.toString(),
        sender: sender
          ? {
              id: sender._id.toString(),
              name:
                sender.profile?.displayName ||
                sender.name ||
                sender.email?.split("@")[0] ||
                "Unknown User",
              avatar: sender.profile?.avatar,
            }
          : null,
        content: newMessage.content,
        contentType: newMessage.contentType,
        imageUrl: newMessage.imageUrl,
        videoUrl: newMessage.videoUrl,
        audioUrl: newMessage.audioUrl,
        documentUrl: newMessage.documentUrl,
        documentName: newMessage.documentName,
        location: newMessage.location,
        contact: newMessage.contact,
        productId: newMessage.productId?.toString(),
        orderId: newMessage.orderId?.toString(),
        replyTo: newMessage.replyTo,
        status: newMessage.status,
        sentAt: newMessage.sentAt,
        readBy: newMessage.readBy.map((id: mongoose.Types.ObjectId) =>
          id.toString(),
        ),
        createdAt: newMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 },
    );
  }
}

// PUT - Edit a message
export async function PUT(
  request: Request,
  { params }: { params: { conversationId: string } },
) {
  try {
    const token = extractToken(request as any);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    const { conversationId } = params;
    const body = await request.json();
    const { messageId, content } = body;

    if (!messageId || !content) {
      return NextResponse.json(
        { success: false, error: "Message ID and content are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const messageObjectId = new mongoose.Types.ObjectId(messageId);

    // Verify user owns this message
    const message = await db.collection("messages").findOne({
      _id: messageObjectId,
      senderId: userId,
      conversationId: new mongoose.Types.ObjectId(conversationId),
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message not found or access denied" },
        { status: 404 },
      );
    }

    // Update message
    await db.collection("messages").updateOne(
      { _id: messageObjectId },
      {
        $set: {
          content,
          editedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: "Message updated successfully",
    });
  } catch (error) {
    console.error("Error editing message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to edit message" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a message (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: { conversationId: string } },
) {
  try {
    const token = extractToken(request as any);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    const { conversationId } = params;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const messageObjectId = new mongoose.Types.ObjectId(messageId);

    // Verify user owns this message
    const message = await db.collection("messages").findOne({
      _id: messageObjectId,
      senderId: userId,
      conversationId: new mongoose.Types.ObjectId(conversationId),
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message not found or access denied" },
        { status: 404 },
      );
    }

    // Soft delete message
    await db.collection("messages").updateOne(
      { _id: messageObjectId },
      {
        $set: {
          deleted: true,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete message" },
      { status: 500 },
    );
  }
}
