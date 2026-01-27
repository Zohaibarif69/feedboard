"use client";

import { useState, useEffect } from "react";

export interface Feedback {
  id: string;
  title: string;
  description: string;
  category: "feature" | "bug" | "improvement" | "other";
  status: string;
  author: string;
  authorId: string;
  upvotes: number;
  upvotedBy: string[];
  comments: Array<{
    id: string;
    author: string;
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const MOCK_FEEDBACK: Feedback[] = [
  {
    id: "1",
    title: "Dark Mode Support",
    description: "Add a dark mode option to the application for better usability at night.",
    category: "feature",
    status: "open",
    author: "john_doe",
    authorId: "1",
    upvotes: 45,
    upvotedBy: ["jane_smith"],
    comments: [],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Fix login button styling",
    description: "The login button appears misaligned on mobile devices.",
    category: "bug",
    status: "open",
    author: "jane_smith",
    authorId: "2",
    upvotes: 12,
    upvotedBy: [],
    comments: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Improve Search Performance",
    description: "Search results are slow when dealing with large datasets.",
    category: "improvement",
    status: "open",
    author: "bob_wilson",
    authorId: "3",
    upvotes: 28,
    upvotedBy: ["john_doe", "jane_smith"],
    comments: [],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useFeedback() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load feedback from localStorage or use mock data
    const storedFeedback = localStorage.getItem("feedback");
    if (storedFeedback) {
      try {
        setFeedbackList(JSON.parse(storedFeedback));
      } catch (error) {
        console.error("Failed to parse stored feedback:", error);
        setFeedbackList(MOCK_FEEDBACK);
      }
    } else {
      setFeedbackList(MOCK_FEEDBACK);
    }
    setLoading(false);
  }, []);

  const addFeedback = (feedback: Omit<Feedback, "id" | "upvotes" | "upvotedBy" | "createdAt" | "updatedAt">) => {
    const newFeedback: Feedback = {
      ...feedback,
      id: Date.now().toString(),
      upvotes: 0,
      upvotedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...feedbackList, newFeedback];
    setFeedbackList(updated);
    localStorage.setItem("feedback", JSON.stringify(updated));
    return newFeedback;
  };

  const upvoteFeedback = (feedbackId: string, username: string) => {
    const updated = feedbackList.map((f) => {
      if (f.id === feedbackId) {
        const hasUpvoted = f.upvotedBy.includes(username);
        return {
          ...f,
          upvotes: hasUpvoted ? f.upvotes - 1 : f.upvotes + 1,
          upvotedBy: hasUpvoted
            ? f.upvotedBy.filter((u) => u !== username)
            : [...f.upvotedBy, username],
        };
      }
      return f;
    });
    setFeedbackList(updated);
    localStorage.setItem("feedback", JSON.stringify(updated));
  };

  const getFeedbackById = (id: string) => {
    return feedbackList.find((f) => f.id === id);
  };

  return {
    feedbackList,
    loading,
    addFeedback,
    upvoteFeedback,
    getFeedbackById,
  };
}