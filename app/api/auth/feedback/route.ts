import { NextRequest, NextResponse } from "next/server";

// In-memory storage (replace with database in production)
let feedbackItems: any[] = [];
let feedbackIdCounter = 1;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const author = searchParams.get("author");

    let results = [...feedbackItems];

    // Filter by ID
    if (id) {
      results = results.filter((item) => item.id === parseInt(id));
    }

    // Filter by category
    if (category) {
      results = results.filter((item) => item.category === category);
    }

    // Filter by status
    if (status) {
      results = results.filter((item) => item.status === status);
    }

    // Filter by author
    if (author) {
      results = results.filter((item) => item.author === author);
    }

    // Sort by date (newest first)
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

    // Validate required fields
    if (!body.title || !body.description || !body.category || !body.author || !body.authorId) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, category, author, authorId" },
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
    const validStatuses = ["open", "in-progress", "completed", "closed"];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: open, in-progress, completed, closed" },
        { status: 400 }
      );
    }

    const newFeedback = {
      id: feedbackIdCounter++,
      title: body.title,
      description: body.description,
      category: body.category,
      status: body.status || "open",
      author: body.author,
      authorId: body.authorId,
      comments: body.comments || [],
      votes: body.votes || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    feedbackItems.push(newFeedback);

    return NextResponse.json(newFeedback, { status: 201 });
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

    const feedbackIndex = feedbackItems.findIndex((item) => item.id === feedbackId);

    if (feedbackIndex === -1) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    const existingFeedback = feedbackItems[feedbackIndex];

    // Update allowed fields
    if (body.title !== undefined) existingFeedback.title = body.title;
    if (body.description !== undefined) existingFeedback.description = body.description;
    if (body.category !== undefined) {
      const validCategories = ["feature", "bug", "improvement", "other"];
      if (!validCategories.includes(body.category)) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
      }
      existingFeedback.category = body.category;
    }
    if (body.status !== undefined) {
      const validStatuses = ["open", "in-progress", "completed", "closed"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
      existingFeedback.status = body.status;
    }
    if (body.comments !== undefined) existingFeedback.comments = body.comments;
    if (body.votes !== undefined) existingFeedback.votes = body.votes;

    existingFeedback.updatedAt = new Date().toISOString();

    feedbackItems[feedbackIndex] = existingFeedback;

    return NextResponse.json(existingFeedback, { status: 200 });
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
    const feedbackIndex = feedbackItems.findIndex((item) => item.id === feedbackId);

    if (feedbackIndex === -1) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    const deletedFeedback = feedbackItems.splice(feedbackIndex, 1)[0];

    return NextResponse.json(
      { message: "Feedback deleted successfully", feedback: deletedFeedback },
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
