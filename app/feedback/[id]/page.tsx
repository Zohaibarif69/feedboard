"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "../../components/Header";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { ArrowUp, ArrowLeft, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useFeedback } from "../../hooks/useFeedback";
import { useAuth } from "../../hooks/useAuth";

export default function FeedbackDetailPage() {
  const { feedbackList, upvoteFeedback } = useFeedback();
  const { user, isAuthenticated, loading, login, logout, register, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Convert string ID from URL to number for comparison
  const feedbackId = typeof params.id === 'string' ? parseInt(params.id) : params.id;
  const feedback = feedbackList.find((f: any) => f.id === feedbackId);

  if (!feedback) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mb-6"
            >
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Button>
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Feedback not found</p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const handleUpvote = (id: number, hasUpvoted: boolean) => {
    if (!isAuthenticated || !user || !token) {
      toast.error("Please log in to upvote");
      router.push("/login");
      return;
    }
    upvoteFeedback(id, token, hasUpvoted);
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    if (!isAuthenticated || !user || !token) {
      toast.error("Please log in to comment");
      router.push("/login");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "comment",
          feedbackId: feedback.id,
          text: comment,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add comment");
      }

      const newComment = await response.json();

      // Add comment to local state
      if (!feedback.comments) {
        feedback.comments = [];
      }
      feedback.comments.push(newComment);
      setComment("");
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add comment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Feedback
          </Button>

          {/* Feedback Details Card */}
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">{feedback.title}</h1>
                <p className="text-gray-600 text-lg mb-6 leading-relaxed">{feedback.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-blue-100 text-blue-800 capitalize">{feedback.category}</Badge>
                  <Badge variant="outline" className="capitalize border-gray-300 text-gray-700">{feedback.status.replace('_', ' ')}</Badge>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={() => handleUpvote(feedback.id, feedback.upvotedBy?.includes(user?.id ?? -1) ?? false)}
                  variant={feedback.upvotedBy?.includes(user?.id ?? -1) ? "default" : "outline"}
                  size="lg"
                  className="flex flex-col items-center gap-1 h-auto py-3 px-4 rounded-lg"
                >
                  <ArrowUp className="size-5" />
                  <span className="text-xs font-semibold">{feedback.upvotes}</span>
                </Button>
                <span className="text-xs text-gray-500 text-center">Upvotes</span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 mt-6">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{feedback.author}</span> posted on{" "}
                <span className="font-semibold text-gray-900">{new Date(feedback.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </p>
            </div>
          </Card>

          {/* Comments Section Card */}
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="size-6 text-blue-600" />
              Comments ({feedback.comments?.length || 0})
            </h2>

            {isAuthenticated && (
              <div className="mb-8 pb-8 border-b border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Add Your Comment</label>
                <Textarea
                  placeholder="Share your thoughts on this feedback..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mb-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  rows={4}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
                >
                  {isLoading ? "Adding Comment..." : "Add Comment"}
                </Button>
              </div>
            )}

            {!isAuthenticated && (
              <div className="mb-8 pb-8 border border-blue-200 bg-blue-50 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-700 mb-4">
                  Sign in to add comments and upvote feedback
                </p>
                <Button
                  onClick={() => router.push("/login")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Sign In
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {feedback.comments && feedback.comments.length > 0 ? (
                feedback.comments.map((comment: any) => (
                  <div
                    key={comment.id}
                    className="p-5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-gray-900">{comment.author}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-12">
                  <MessageSquare className="size-8 mx-auto mb-3 text-gray-400" />
                  No comments yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

