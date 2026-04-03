import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { verifyToken, extractToken } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";
// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://deoniyogisubizo:maiden410@myhipa.qkj7r5a.mongodb.net/hipa";

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

// POST - Add or update reaction
export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { conversationId } = await params;
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
    const { messageId, emoji } = body;

    if (!messageId || !emoji) {
      return NextResponse.json(
        { success: false, error: "Message ID and emoji are required" },
        { status: 400 },
      );
    }

    // Validate emoji (allow common reaction emojis)
    const allowedEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
    if (!allowedEmojis.includes(emoji)) {
      return NextResponse.json(
        { success: false, error: "Invalid emoji" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);
    const messageObjectId = new mongoose.Types.ObjectId(messageId);

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

    // Verify message exists in this conversation
    const message = await db.collection("messages").findOne({
      _id: messageObjectId,
      conversationId: conversationObjectId,
      deleted: false,
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 },
      );
    }

    // Check if user already reacted to this message
    const existingReaction = await db.collection("reactions").findOne({
      messageId: messageObjectId,
      userId,
    });

    if (existingReaction) {
      // Update existing reaction
      await db.collection("reactions").updateOne(
        { _id: existingReaction._id },
        {
          $set: {
            emoji,
            updatedAt: new Date(),
          },
        },
      );
    } else {
      // Create new reaction
      await db.collection("reactions").insertOne({
        messageId: messageObjectId,
        conversationId: conversationObjectId,
        userId,
        emoji,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Get updated reactions for this message
    const reactions = await db
      .collection("reactions")
      .find({ messageId: messageObjectId })
      .toArray();

    // Group reactions by emoji
    const groupedReactions: { [key: string]: string[] } = {};
    reactions.forEach((reaction: any) => {
      if (!groupedReactions[reaction.emoji]) {
        groupedReactions[reaction.emoji] = [];
      }
      groupedReactions[reaction.emoji].push(reaction.userId.toString());
    });

    // Broadcast reaction update to all participants
    const otherParticipants = conversation.participants.filter(
      (p: mongoose.Types.ObjectId) => p.toString() !== user.userId,
    );

    for (const participantId of otherParticipants) {
      await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/messages/ws`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "reaction_updated",
            conversationId,
            recipientId: participantId.toString(),
            data: {
              messageId,
              reactions: groupedReactions,
            },
          }),
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reaction added successfully",
      reactions: groupedReactions,
    });
  } catch (error) {
    console.error("Error adding reaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add reaction" },
      { status: 500 },
    );
  }
}

// DELETE - Remove reaction
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { conversationId } = await params;
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
    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);
    const messageObjectId = new mongoose.Types.ObjectId(messageId);

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

    // Remove reaction
    await db.collection("reactions").deleteOne({
      messageId: messageObjectId,
      userId,
    });

    // Get updated reactions for this message
    const reactions = await db
      .collection("reactions")
      .find({ messageId: messageObjectId })
      .toArray();

    // Group reactions by emoji
    const groupedReactions: { [key: string]: string[] } = {};
    reactions.forEach((reaction: any) => {
      if (!groupedReactions[reaction.emoji]) {
        groupedReactions[reaction.emoji] = [];
      }
      groupedReactions[reaction.emoji].push(reaction.userId.toString());
    });

    // Broadcast reaction update to all participants
    const otherParticipants = conversation.participants.filter(
      (p: mongoose.Types.ObjectId) => p.toString() !== user.userId,
    );

    for (const participantId of otherParticipants) {
      await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/messages/ws`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "reaction_updated",
            conversationId,
            recipientId: participantId.toString(),
            data: {
              messageId,
              reactions: groupedReactions,
            },
          }),
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reaction removed successfully",
      reactions: groupedReactions,
    });
  } catch (error) {
    console.error("Error removing reaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove reaction" },
      { status: 500 },
    );
  }
}
