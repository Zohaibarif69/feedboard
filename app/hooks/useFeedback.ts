"use client";

import { useState, useEffect } from "react";

export interface Feedback {
  id: number;
  title: string;
  description: string;
  category: "feature" | "bug" | "improvement" | "other";
  status: string;
  author: string;
  authorId: number;
  upvotes: number;
  upvotedBy: number[];
  comments: Array<{
    id: number;
    author: string;
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export function useFeedback() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [upvotingIds, setUpvotingIds] = useState<Set<number>>(new Set()); // Track upvotes in progress

  // Load feedback from API on mount
  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/feedback");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch feedback");
      }
      const data = await response.json();
      setFeedbackList(data);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      setFeedbackList([]);
    } finally {
      setLoading(false);
    }
  };

  const addFeedback = async (feedback: {
    title: string;
    description: string;
    category: "feature" | "bug" | "improvement" | "other";
  }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) throw new Error("Failed to create feedback");
      const newFeedback = await response.json();
      setFeedbackList([newFeedback, ...feedbackList]);
      return newFeedback;
    } catch (error) {
      console.error("Error creating feedback:", error);
      throw error;
    }
  };

  // Handle upvote/unvote with prevention of duplicate requests
  const upvoteFeedback = async (feedbackId: number, token: string, hasUpvoted: boolean) => {
    // Prevent duplicate requests
    if (upvotingIds.has(feedbackId)) {
      return;
    }

    setUpvotingIds((prev) => new Set([...prev, feedbackId]));

    try {
      const action = hasUpvoted ? "unvote" : "upvote";
      const response = await fetch("/api/auth/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, feedbackId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action}`);
      }

      // Refresh feedback list to get updated upvote counts
      await fetchFeedback();
    } catch (error) {
      console.error(`Error ${hasUpvoted ? "removing" : "adding"} upvote:`, error);
      throw error;
    } finally {
      setUpvotingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(feedbackId);
        return newSet;
      });
    }
  };

  const getFeedbackById = (id: number) => {
    return feedbackList.find((f) => f.id === id);
  };

  return {
    feedbackList,
    loading,
    upvotingIds, // Export to prevent UI submission when upvote in progress
    addFeedback,
    upvoteFeedback,
    getFeedbackById,
    fetchFeedback,
  };
}