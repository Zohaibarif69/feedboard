import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Verify token helper
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

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : null;
  const cookieToken = request.cookies.get("token")?.value || null;
  return bearer || cookieToken;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const author = searchParams.get("author");

    // Build where clause
    const where: any = {};

    if (id) {
      where.id = parseInt(id);
    }
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }
    if (author) {
      where.author = { username: author };
    }

    const feedbackItems = await prisma.feedback.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        upvoteBy: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format response
    const results = feedbackItems.map((item: {
      id: number;
      title: string;
      description: string;
      category: string;
      status: string;
      upvotes: number;
      author: { username: string };
      authorId: number;
      comments: any[];
      upvoteBy: { userId: number }[];
      createdAt: Date;
      updatedAt: Date;
    }) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      status: item.status,
      upvotes: item.upvotes,
      author: item.author.username,
      authorId: item.authorId,
      comments: item.comments,
      upvotedBy: item.upvoteBy.map((u) => u.userId),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    // UPVOTE/UNVOTE FEEDBACK
    if (action === "upvote" || action === "unvote") {
      const token = getTokenFromRequest(request);
      
      if (!token) {
        return NextResponse.json(
          { error: "Unauthorized - no token provided" },
          { status: 401 }
        );
      }

      const session = await verifyToken(token);
      
      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized - invalid token" },
          { status: 401 }
        );
      }

      if (!body.feedbackId) {
        return NextResponse.json(
          { error: "Feedback ID is required" },
          { status: 400 }
        );
      }

      const feedbackId = parseInt(body.feedbackId);

      // Check if feedback exists
      const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
      });

      if (!feedback) {
        return NextResponse.json(
          { error: "Feedback not found" },
          { status: 404 }
        );
      }

      if (action === "upvote") {
        // Check if already upvoted
        const existingUpvote = await prisma.upvote.findUnique({
          where: {
            feedbackId_userId: {
              feedbackId,
              userId: session.userId,
            },
          },
        });

        if (existingUpvote) {
          return NextResponse.json(
            { error: "Already upvoted" },
            { status: 400 }
          );
        }

        // Create upvote and increment counter
        await prisma.$transaction([
          prisma.upvote.create({
            data: {
              feedbackId,
              userId: session.userId,
            },
          }),
          prisma.feedback.update({
            where: { id: feedbackId },
            data: { upvotes: { increment: 1 } },
          }),
        ]);

        return NextResponse.json(
          { message: "Upvoted successfully" },
          { status: 200 }
        );
      } else {
        // Remove upvote and decrement counter
        const existingUpvote = await prisma.upvote.findUnique({
          where: {
            feedbackId_userId: {
              feedbackId,
              userId: session.userId,
            },
          },
        });

        if (!existingUpvote) {
          return NextResponse.json(
            { error: "Not upvoted yet" },
            { status: 400 }
          );
        }

        await prisma.$transaction([
          prisma.upvote.delete({
            where: {
              feedbackId_userId: {
                feedbackId,
                userId: session.userId,
              },
            },
          }),
          prisma.feedback.update({
            where: { id: feedbackId },
            data: { upvotes: { decrement: 1 } },
          }),
        ]);

        return NextResponse.json(
          { message: "Upvote removed successfully" },
          { status: 200 }
        );
      }
    }

    // CREATE FEEDBACK
    // Validate required fields
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - no token provided" },
        { status: 401 }
      );
    }

    const session = await verifyToken(token);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - invalid token" },
        { status: 401 }
      );
    }

    if (!body.title || !body.description || !body.category) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, category" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ["feature", "bug", "improvement", "other"];
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: "Invalid category. Must be one of: feature, bug, improvement, other" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["open", "planned", "in_progress", "closed"];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: open, planned, in_progress, closed" },
        { status: 400 }
      );
    }

    const newFeedback = await prisma.feedback.create({
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        status: body.status || "open",
        authorId: session.userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: newFeedback.id,
        title: newFeedback.title,
        description: newFeedback.description,
        category: newFeedback.category,
        status: newFeedback.status,
        upvotes: newFeedback.upvotes,
        author: newFeedback.author.username,
        authorId: newFeedback.authorId,
        comments: [],
        createdAt: newFeedback.createdAt,
        updatedAt: newFeedback.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Feedback ID is required" },
        { status: 400 }
      );
    }

    const feedbackId = parseInt(id);
    const body = await request.json();

    const existingFeedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!existingFeedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;

    if (body.category !== undefined) {
      const validCategories = ["feature", "bug", "improvement", "other"];
      if (!validCategories.includes(body.category)) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
      }
      updateData.category = body.category;
    }

    if (body.status !== undefined) {
      const validStatuses = ["open", "planned", "in_progress", "closed"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: updatedFeedback.id,
        title: updatedFeedback.title,
        description: updatedFeedback.description,
        category: updatedFeedback.category,
        status: updatedFeedback.status,
        upvotes: updatedFeedback.upvotes,
        author: updatedFeedback.author.username,
        authorId: updatedFeedback.authorId,
        comments: updatedFeedback.comments,
        createdAt: updatedFeedback.createdAt,
        updatedAt: updatedFeedback.updatedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Feedback ID is required" },
        { status: 400 }
      );
    }

    const feedbackId = parseInt(id);

    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    await prisma.feedback.delete({
      where: { id: feedbackId },
    });

    return NextResponse.json(
      { message: "Feedback deleted successfully", feedback },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return NextResponse.json(
      { error: "Failed to delete feedback" },
      { status: 500 }
    );
  }
}
