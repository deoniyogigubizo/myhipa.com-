import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/database/mongodb";
import { User, AuditLog } from "@/lib/database/schemas";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json();

    // Validate required fields
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 },
      );
    }

    // Validate role
    if (!["buyer", "seller", "super_admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be buyer, seller, or super_admin" },
        { status: 400 },
      );
    }

    await connectDB();

    // Find user by email (try exact match first, then case-insensitive)
    console.log("Login attempt for email:", email);
    console.log("Database name:", User.db?.name);
    console.log("Collection name:", User.collection?.name);
    console.log("Searching for email (lowercase):", email.toLowerCase());

    // Try exact match first
    let user = await User.findOne({ email: email.toLowerCase() });
    console.log("Exact match result:", user ? "Found" : "Not found");

    if (!user) {
      // Try case-insensitive search
      console.log("Trying case-insensitive search...");
      user = await User.findOne({
        email: {
          $regex: new RegExp(
            "^" + email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$",
            "i",
          ),
        },
      });
      console.log(
        "Case-insensitive search result:",
        user ? "Found" : "Not found",
      );
    }

    if (!user) {
      // Try trimmed search
      console.log("Trying trimmed search...");
      user = await User.findOne({ email: email.trim().toLowerCase() });
      console.log("Trimmed search result:", user ? "Found" : "Not found");
    }

    console.log("Final user found:", user ? "Yes" : "No");
    if (!user) {
      console.log("User not found for email:", email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Check if user is deleted
    if (user.deletedAt) {
      return NextResponse.json(
        { error: "This account has been deactivated" },
        { status: 403 },
      );
    }

    // Verify password - check both passwordHash and password fields for backward compatibility
    const passwordToCheck = user.passwordHash || user.password;
    if (!passwordToCheck) {
      console.log("User has no password hash:", user.email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const isPasswordValid = await bcrypt.compare(password, passwordToCheck);
    console.log("Password valid:", isPasswordValid);
    if (!isPasswordValid) {
      console.log("Password mismatch for user:", user.email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Role-based access control
    if (role === "super_admin") {
      if (user.role !== "super_admin") {
        return NextResponse.json(
          {
            error:
              "Access denied. This account does not have super admin privileges.",
          },
          { status: 403 },
        );
      }
    } else if (role === "seller") {
      // Sellers can login if they are seller or both
      if (
        user.role !== "seller" &&
        user.role !== "both" &&
        user.role !== "admin" &&
        user.role !== "super_admin"
      ) {
        return NextResponse.json(
          {
            error:
              "This account is not registered as a seller. Please login as a buyer.",
          },
          { status: 403 },
        );
      }
    } else if (role === "buyer") {
      // Buyers can login if they are buyer, both, admin, or super_admin
      if (user.role === "seller") {
        return NextResponse.json(
          {
            error:
              "This account is registered as a seller. Please login as a seller.",
          },
          { status: 403 },
        );
      }
    }

    // Update last login
    if (user.auth) {
      user.auth.lastLogin = new Date();
    } else {
      user.auth = {
        lastLogin: new Date(),
        emailVerified: false,
        twoFactorEnabled: false,
        loginProvider: "email",
      };
    }
    await user.save();

    // Log login activity
    await (AuditLog as any).log({
      actor: {
        userId: user._id,
        role: user.role,
        ip:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
      action: "user_login",
      entity: {
        type: "user",
        id: user._id,
      },
      metadata: {
        loginProvider: user.auth?.loginProvider || "email",
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Return user data (without password hash)
    const userData = {
      id: user._id,
      email: user.email,
      displayName:
        user.profile?.displayName ||
        user.name ||
        user.email?.split("@")[0] ||
        "User",
      avatar: user.profile?.avatar,
      role: user.role,
      kycStatus: user.kycStatus,
    };

    const response = NextResponse.json({
      user: userData,
      token,
    });

    // Set token as cookie for middleware authentication
    response.cookies.set("hipa_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
