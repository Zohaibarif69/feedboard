"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "./components/Header";
import { Card } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { ArrowUp, MessageSquare, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useFeedback } from "./hooks/useFeedback";
import { useAuth } from "./hooks/useAuth";

export default function DashboardPage() {
  const { feedbackList, upvoteFeedback } = useFeedback();
  const { user, isAuthenticated, loading, login, logout, register } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const handleUpvote = (id: number, hasUpvoted: boolean) => {
    if (!isAuthenticated || !user) {
      toast.error("Please log in to upvote");
      router.push("/login");
      return;
    }
    upvoteFeedback(id, String(user.id), hasUpvoted);
  };

  const filteredFeedback = selectedCategory === "all" 
    ? feedbackList 
    : feedbackList.filter((f: any) => f.category === selectedCategory);

  const sortedFeedback = [...filteredFeedback].sort((a, b) => b.upvotes - a.upvotes);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 mb-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="size-8" />
              <h2 className="text-2xl font-semibold">Community Feedback</h2>
            </div>
            <p className="text-white/90 mb-4">
              Discover what the community is asking for. Vote on ideas you'd like to see implemented.
            </p>
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-white/80">Total Feedback</p>
                <p className="text-2xl font-semibold">{feedbackList.length}</p>
              </div>
              <div className="border-l border-white/20 pl-4">
                <p className="text-white/80">Total Upvotes</p>
                <p className="text-2xl font-semibold">
                  {feedbackList.reduce((sum: number, f: any) => sum + f.upvotes, 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
            <TabsList className="grid w-full grid-cols-5 bg-white">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="feature">Features</TabsTrigger>
              <TabsTrigger value="bug">Bugs</TabsTrigger>
              <TabsTrigger value="improvement">Improvements</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Feedback List */}
          <div className="space-y-4">
            {sortedFeedback.length === 0 ? (
              <div className="bg-white rounded-lg border p-12 text-center">
                <MessageSquare className="size-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No feedback yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Be the first to share your ideas!
                </p>
                {isAuthenticated && (
                  <Button onClick={() => router.push("/create")}>
                    Create Feedback
                  </Button>
                )}
              </div>
            ) : (
              sortedFeedback.map(feedback => {
                const hasUpvoted = user ? feedback.upvotedBy.includes(user.id) : false;

                return (
                  <Card
                    key={feedback.id}
                    className="p-6 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => router.push(`/feedback/${feedback.id}`)}
                  >
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <Button
                          variant={hasUpvoted ? "default" : "outline"}
                          size="sm"
                          className="h-auto flex-col gap-1 px-3 py-2"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            handleUpvote(feedback.id, hasUpvoted);
                          }}
                          disabled={!isAuthenticated}
                        >
                          <ArrowUp className="size-4" />
                          <span className="text-sm">{feedback.upvotes}</span>
                        </Button>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold mb-1">{feedback.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {feedback.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary">{feedback.category}</Badge>
                          <span>•</span>
                          <span>by {feedback.author}</span>
                          <span>•</span>
                          <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
