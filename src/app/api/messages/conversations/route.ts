import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { verifyToken, extractToken } from "@/lib/auth/middleware";


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
    bufferCommands: true,
  };

  const conn = await mongoose.connect(MONGODB_URI, opts);
  cachedConn = conn.connection;
  return cachedConn;
}

// GET - Get all conversations for the authenticated user
export async function GET(request: Request) {
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

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);

    // Get all conversations where user is a participant
    const conversations = await db
      .collection("conversations")
      .find({
        participants: userId,
        status: "active",
      })
      .sort({ updatedAt: -1 })
      .toArray();

    // Enrich conversations with participant details and unread count
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv: any) => {
        // Get other participant details
        const otherParticipantId = conv.participants.find(
          (p: mongoose.Types.ObjectId) => p.toString() !== user.userId,
        );

        let otherParticipant = null;
        if (otherParticipantId) {
          otherParticipant = await db.collection("users").findOne(
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
          if (!otherParticipant) {
            const sellerDoc = await db
              .collection("sellers")
              .findOne(
                { _id: otherParticipantId },
                { projection: { userId: 1, "store.name": 1, "store.slug": 1 } },
              );
            if (sellerDoc?.userId) {
              otherParticipant = await db.collection("users").findOne(
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
            if (!otherParticipant && sellerDoc) {
              otherParticipant = {
                _id: otherParticipantId,
                name: sellerDoc.store?.name || "Unknown Seller",
                profile: { avatar: undefined },
                email: undefined,
              };
            }
          }

          // Transform the data to match expected format
          if (otherParticipant) {
            otherParticipant = {
              _id: otherParticipant._id,
              name:
                otherParticipant.profile?.displayName ||
                otherParticipant.name ||
                otherParticipant.email?.split("@")[0] ||
                "Unknown User",
              avatar: otherParticipant.profile?.avatar,
              email: otherParticipant.email,
            };
          }
        }

        // Get unread count for current user
        const unreadEntry = conv.unreadCount?.find(
          (u: any) => u.userId.toString() === user.userId,
        );

        // Get last message
        let lastMessage = null;
        if (conv.lastMessage) {
          const sender = await db
            .collection("users")
            .findOne(
              { _id: conv.lastMessage.senderId },
              { projection: { "profile.displayName": 1, email: 1 } },
            );
          lastMessage = {
            ...conv.lastMessage,
            senderName:
              sender?.profile?.displayName ||
              sender?.email?.split("@")[0] ||
              "Unknown",
          };
        }

        return {
          id: conv._id.toString(),
          otherParticipant: otherParticipant
            ? {
                id: otherParticipant._id.toString(),
                name: otherParticipant.name,
                avatar: otherParticipant.avatar,
                email: otherParticipant.email,
              }
            : null,
          lastMessage,
          unreadCount: unreadEntry?.count || 0,
          orderId: conv.orderId?.toString(),
          productId: conv.productId?.toString(),
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      conversations: enrichedConversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}

// POST - Create a new conversation
export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      recipientId,
      productId,
      orderId,
      initialMessage,
      initialProductMessage,
    } = body;

    if (!recipientId) {
      return NextResponse.json(
        { success: false, error: "Recipient ID is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    let recipientObjectId = new mongoose.Types.ObjectId(recipientId);

    // Resolve seller ID to user ID if needed
    // The recipientId might be a sellers collection document ID
    const recipientAsUser = await db
      .collection("users")
      .findOne({ _id: recipientObjectId }, { projection: { _id: 1 } });

    if (!recipientAsUser) {
      // Not a user ID - try resolving as seller ID
      const sellerDoc = await db
        .collection("sellers")
        .findOne({ _id: recipientObjectId }, { projection: { userId: 1 } });
      if (sellerDoc?.userId) {
        recipientObjectId = new mongoose.Types.ObjectId(sellerDoc.userId);
      }
    }

    // Check if conversation already exists between these users
    // Check for both the resolved user ID and the original recipient ID (in case it was a seller ID)
    const participantIdsToCheck = [userId, recipientObjectId];
    if (recipientObjectId.toString() !== recipientId) {
      participantIdsToCheck.push(new mongoose.Types.ObjectId(recipientId));
    }

    const existingConversation = await db.collection("conversations").findOne({
      participants: { $all: [userId, recipientObjectId] },
      status: "active",
    });

    // Also check if conversation exists with the original seller ID as participant
    if (!existingConversation && recipientObjectId.toString() !== recipientId) {
      const existingWithSellerId = await db
        .collection("conversations")
        .findOne({
          participants: {
            $all: [userId, new mongoose.Types.ObjectId(recipientId)],
          },
          status: "active",
        });

      if (existingWithSellerId) {
        // Update the conversation to use the user ID instead of seller ID
        await db.collection("conversations").updateOne(
          { _id: existingWithSellerId._id },
          {
            $set: {
              "participants.$[elem]": recipientObjectId,
              updatedAt: new Date(),
            },
          },
          {
            arrayFilters: [{ elem: new mongoose.Types.ObjectId(recipientId) }],
          },
        );

        return NextResponse.json({
          success: true,
          conversationId: existingWithSellerId._id.toString(),
          message: "Conversation already exists",
        });
      }
    }

    if (existingConversation) {
      return NextResponse.json({
        success: true,
        conversationId: existingConversation._id.toString(),
        message: "Conversation already exists",
      });
    }

    // Create new conversation
    const newConversation = {
      participants: [userId, recipientObjectId],
      unreadCount: [
        { userId: userId, count: 0 },
        { userId: recipientObjectId, count: 0 },
      ],
      productId: productId ? new mongoose.Types.ObjectId(productId) : undefined,
      orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection("conversations")
      .insertOne(newConversation);

    // If initial message provided, send it
    if (initialMessage) {
      const message = {
        conversationId: result.insertedId,
        senderId: userId,
        content: initialMessage,
        contentType: "text",
        readBy: [userId],
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("messages").insertOne(message);

      // Update conversation with last message
      await db.collection("conversations").updateOne(
        { _id: result.insertedId },
        {
          $set: {
            lastMessage: {
              content: initialMessage,
              senderId: userId,
              createdAt: new Date(),
            },
            updatedAt: new Date(),
          },
          $inc: { "unreadCount.$[elem].count": 1 },
        },
        {
          arrayFilters: [{ "elem.userId": recipientObjectId }],
        },
      );
    }

    // If initial product message provided, send it
    if (initialProductMessage) {
      const message = {
        conversationId: result.insertedId,
        senderId: userId,
        content: initialProductMessage.content || "Shared a product",
        contentType: "product",
        product: {
          id: initialProductMessage.id,
          title: initialProductMessage.title,
          price: initialProductMessage.price,
          image: initialProductMessage.image,
          slug: initialProductMessage.slug,
        },
        readBy: [userId],
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("messages").insertOne(message);

      // Update conversation with last message
      await db.collection("conversations").updateOne(
        { _id: result.insertedId },
        {
          $set: {
            lastMessage: {
              content: initialProductMessage.content || "Shared a product",
              senderId: userId,
              createdAt: new Date(),
            },
            updatedAt: new Date(),
          },
          $inc: { "unreadCount.$[elem].count": 1 },
        },
        {
          arrayFilters: [{ "elem.userId": recipientObjectId }],
        },
      );
    }

    // Fetch seller information to return in response
    const seller = await db.collection("users").findOne(
      { _id: recipientObjectId },
      {
        projection: {
          _id: 1,
          "profile.displayName": 1,
          "profile.avatar": 1,
          email: 1,
        },
      },
    );

    const sellerInfo = seller
      ? {
          id: seller._id.toString(),
          name:
            seller.profile?.displayName ||
            seller.email?.split("@")[0] ||
            "Unknown User",
          avatar: seller.profile?.avatar || "",
          email: seller.email,
        }
      : null;

    return NextResponse.json({
      success: true,
      conversationId: result.insertedId.toString(),
      otherParticipant: sellerInfo,
      message: "Conversation created successfully",
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create conversation" },
      { status: 500 },
    );
  }
}
