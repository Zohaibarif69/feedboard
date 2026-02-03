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
  const { user, isAuthenticated, loading, login, logout, register, token } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const handleUpvote = (id: number, hasUpvoted: boolean) => {
    if (!isAuthenticated || !user || !token) {
      toast.error("Please log in to upvote");
      router.push("/login");
      return;
    }
    upvoteFeedback(id, token, hasUpvoted);
  };

  const filteredFeedback = selectedCategory === "all" 
    ? feedbackList 
    : feedbackList.filter((f: any) => f.category === selectedCategory);

  const sortedFeedback = [...filteredFeedback].sort((a, b) => b.upvotes - a.upvotes);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto">
          {/* Welcome Banner */}
          <div className="bg-linear-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-10 mb-10 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="size-8" />
                  <h2 className="text-3xl font-bold">Community Feedback</h2>
                </div>
                <p className="text-blue-100 text-lg mb-6">
                  Discover what the community is asking for. Vote on ideas you'd like to see implemented.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-blue-200 text-sm font-medium">Total Feedback</p>
                    <p className="text-4xl font-bold mt-1">{feedbackList.length}</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm font-medium">Total Upvotes</p>
                    <p className="text-4xl font-bold mt-1">
                      {feedbackList.reduce((sum: number, f: any) => sum + f.upvotes, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mb-8">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm border border-gray-200">
                <TabsTrigger value="all" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">All</TabsTrigger>
                <TabsTrigger value="feature" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">Features</TabsTrigger>
                <TabsTrigger value="bug" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">Bugs</TabsTrigger>
                <TabsTrigger value="improvement" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">Improvements</TabsTrigger>
                <TabsTrigger value="other" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">Other</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Feedback List */}
          <div className="space-y-4">
            {sortedFeedback.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
                <MessageSquare className="size-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No feedback yet</h3>
                <p className="text-gray-600 mb-6">
                  Be the first to share your ideas and help shape the product!
                </p>
                {isAuthenticated && (
                  <Button onClick={() => router.push("/create")} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6">
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
                    className="bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer rounded-xl overflow-hidden"
                    onClick={() => router.push(`/feedback/${feedback.id}`)}
                  >
                    <div className="flex gap-6 p-6">
                      {/* Upvote Section */}
                      <div className="flex flex-col items-center gap-2 min-w-fit">
                        <Button
                          variant={hasUpvoted ? "default" : "outline"}
                          size="sm"
                          className={`h-auto flex-col gap-1 px-3 py-2 rounded-lg font-semibold ${hasUpvoted ? 'bg-linear-to-br from-purple-300 to-purple-400 hover:from-purple-400 hover:to-purple-500 text-white shadow-sm' : 'border-2 border-gray-300 text-gray-700 hover:border-purple-300 hover:bg-purple-50'}`}
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            handleUpvote(feedback.id, hasUpvoted);
                          }}
                          disabled={!isAuthenticated}
                        >
                          <ArrowUp className="size-5" />
                          <span className="text-xs font-bold">{feedback.upvotes}</span>
                        </Button>
                        <span className="text-xs text-gray-500 font-medium">
                          {feedback.upvotes === 1 ? 'Vote' : 'Votes'}
                        </span>
                      </div>

                      {/* Feedback Content */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{feedback.title}</h3>
                          <p className="text-gray-600 line-clamp-2 text-sm leading-relaxed">
                            {feedback.description}
                          </p>
                        </div>
                        <div className="flex items-center flex-wrap gap-3 text-xs">
                          <Badge className="bg-blue-100 text-blue-800 capitalize font-medium">{feedback.category}</Badge>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">
                            <span className="font-semibold text-gray-900">{feedback.author}</span>
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">
                            {new Date(feedback.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
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
