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
  const router = useRouter();
  const params = useParams();
  const { feedbackList, upvoteFeedback, addComment } = useFeedback();
  const { user, isAuthenticated } = useAuth();
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const feedback = feedbackList.find((f: any) => f.id === params.id);

  if (!feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
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

  const handleUpvote = () => {
    if (!isAuthenticated || !user) {
      toast.error("Please log in to upvote");
      router.push("/login");
      return;
    }
    upvoteFeedback(feedback.id, user.username);
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    if (!isAuthenticated || !user) {
      toast.error("Please log in to comment");
      router.push("/login");
      return;
    }

    setIsLoading(true);
    try {
      addComment(feedback.id, {
        id: Date.now().toString(),
        author: user.username,
        text: comment,
        timestamp: new Date().toISOString(),
      });
      setComment("");
      toast.success("Comment added successfully");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
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

          {/* Feedback Details */}
          <Card className="p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{feedback.title}</h1>
                <p className="text-muted-foreground mb-4">{feedback.description}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge>{feedback.category}</Badge>
                  <Badge variant="outline">{feedback.status}</Badge>
                </div>
              </div>
              <Button
                onClick={handleUpvote}
                variant={feedback.upvotedBy?.includes(user?.username) ? "default" : "outline"}
                size="lg"
                className="flex flex-col items-center gap-1 h-auto py-3 px-4"
              >
                <ArrowUp className="size-5" />
                <span className="text-sm font-semibold">{feedback.upvotes}</span>
              </Button>
            </div>

            <div className="pt-4 border-t text-sm text-muted-foreground">
              <p>
                Posted by <span className="font-semibold">{feedback.author}</span> on{" "}
                {new Date(feedback.createdAt).toLocaleDateString()}
              </p>
            </div>
          </Card>

          {/* Comments Section */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <MessageSquare className="size-6" />
              Comments ({feedback.comments?.length || 0})
            </h2>

            {isAuthenticated && (
              <div className="mb-6 pb-6 border-b">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mb-3"
                  rows={3}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Adding..." : "Add Comment"}
                </Button>
              </div>
            )}

            {!isAuthenticated && (
              <div className="mb-6 pb-6 border-b p-4 bg-blue-50 rounded-lg">
                <p className="text-sm mb-3">
                  Sign in to add comments and upvote feedback
                </p>
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full"
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
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{comment.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}