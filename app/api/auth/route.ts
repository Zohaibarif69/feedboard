import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const isProduction = process.env.NODE_ENV === "production";

// Utility functions
async function hashPassword(password: string): Promise<string> {
  // Use bcrypt in production for better security
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : null;
  const cookieToken = request.cookies.get("token")?.value || null;
  return bearer || cookieToken;
}

// Verify token
async function verifyToken(token: string): Promise<any | null> {
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || "login";

    // REGISTER ENDPOINT
    if (action === "register") {
      if (!body.username || !body.email || !body.password) {
        return NextResponse.json(
          { error: "Missing required fields: username, email, password" },
          { status: 400 }
        );
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: body.email }, { username: body.username }],
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 409 }
        );
      }

      const hashedPassword = await hashPassword(body.password);

      const newUser = await prisma.user.create({
        data: {
          username: body.username,
          email: body.email,
          password: hashedPassword,
        },
      });

      return NextResponse.json(
        {
          message: "User registered successfully",
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
          },
        },
        { status: 201 }
      );
    }

    // LOGIN ENDPOINT
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "Missing required fields: email, password" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(body.password);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || user.password !== hashedPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate tokens
    const token = generateToken();
    const refreshToken = generateRefreshToken();
    const expiresIn = 3600; // 1 hour
    const refreshExpiresIn = 604800; // 7 days

    console.log("📝 Creating session with token:", token.substring(0, 10) + "...");
    console.log("📝 User ID:", user.id);

    try {
      const session = await prisma.session.create({
        data: {
          token,
          refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
          refreshExpiresAt: new Date(Date.now() + refreshExpiresIn * 1000),
        },
      });

      console.log("✅ Session created with ID:", session.id);
    } catch (error) {
      console.error("❌ Error creating session:", error);
      throw error;
    }

    const response = NextResponse.json(
      {
        message: "Login successful",
        token,
        refreshToken,
        expiresIn,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: expiresIn,
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: refreshExpiresIn,
    });

    return response;
  } catch (error) {
    console.error("Error in auth POST:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const token = getTokenFromRequest(request);

    // GET CURRENT USER
    if (action === "me" || !action) {
      if (!token) {
        return NextResponse.json(
          { error: "Unauthorized - no token provided" },
          { status: 401 }
        );
      }

      const session = await verifyToken(token);

      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized - invalid or expired token" },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          user: {
            id: session.user.id,
            username: session.user.username,
            email: session.user.email,
          },
        },
        { status: 200 }
      );
    }

    // VERIFY TOKEN
    if (action === "verify") {
      if (!token) {
        return NextResponse.json(
          { error: "No token provided" },
          { status: 400 }
        );
      }

      const session = await verifyToken(token);

      if (!session) {
        return NextResponse.json(
          { valid: false, error: "Invalid or expired token" },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          valid: true,
          user: {
            id: session.user.id,
            username: session.user.username,
            email: session.user.email,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in auth GET:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json();

    // REFRESH TOKEN
    if (action === "refresh") {
      if (!body.refreshToken) {
        return NextResponse.json(
          { error: "Refresh token is required" },
          { status: 400 }
        );
      }

      const session = await prisma.session.findUnique({
        where: { refreshToken: body.refreshToken },
      });

      if (!session || session.refreshExpiresAt < new Date()) {
        return NextResponse.json(
          { error: "Invalid or expired refresh token" },
          { status: 401 }
        );
      }

      const newToken = generateToken();
      const expiresIn = 3600; // 1 hour

      await prisma.session.update({
        where: { id: session.id },
        data: {
          token: newToken,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
        },
      });

      const response = NextResponse.json(
        {
          token: newToken,
          expiresIn,
        },
        { status: 200 }
      );

      response.cookies.set("token", newToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        path: "/",
        maxAge: expiresIn,
      });

      return response;
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in auth PUT:", error);
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const token = getTokenFromRequest(request);

    // LOGOUT ENDPOINT
    if (action === "logout") {
      if (!token) {
        return NextResponse.json(
          { error: "No token provided" },
          { status: 400 }
        );
      }

      await prisma.session.deleteMany({
        where: { token },
      });

      const response = NextResponse.json(
        { message: "Logged out successfully" },
        { status: 200 }
      );

      response.cookies.set("token", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        path: "/",
        maxAge: 0,
      });

      response.cookies.set("refreshToken", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        path: "/",
        maxAge: 0,
      });

      return response;
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in auth DELETE:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
