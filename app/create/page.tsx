"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; 
import { useAuth } from "../hooks/useAuth";
import { useFeedback } from "../hooks/useFeedback"; 
import { Header } from "../components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function CreateFeedbackPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"feature" | "bug" | "improvement" | "other">("feature");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addFeedback } = useFeedback();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!user || !isAuthenticated) {
      toast.error("Please log in to continue");
      return;
    }

    setIsSubmitting(true);

    try {
      await addFeedback({
        title,
        description,
        category,
      });

      toast.success("Feedback created successfully!");
      router.push("/"); 
    } catch (error) {
      console.error("Error creating feedback:", error);
      toast.error("Failed to create feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-8 text-gray-600 hover:text-gray-900 hover:bg-white/50"
            onClick={() => router.push("/")} 
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Main Card */}
          <Card className="bg-white rounded-2xl shadow-xl border-0">
            <CardHeader className="space-y-3 pb-8">
              <CardTitle className="text-3xl font-bold text-gray-900">Create New Feedback</CardTitle>
              <CardDescription className="text-base text-gray-600">
                Share your ideas, report bugs, or suggest improvements
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Title Field */}
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-900">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Add a short, descriptive title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">Keep it clear and concise</p>
                </div>

                {/* Description Field */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-900">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your feedback in detail. What problem does this solve? How would it work?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    required
                    className="text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  />
                  <p className="text-xs text-gray-500">Provide as much context as possible</p>
                </div>

                {/* Category Field */}
                <div className="space-y-3">
                  <Label htmlFor="category" className="text-sm font-semibold text-gray-900">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as "feature" | "bug" | "improvement" | "other")}>
                    <SelectTrigger id="category" className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
                      <SelectItem value="feature" className="text-base py-3 cursor-pointer hover:bg-blue-50 focus:bg-blue-50">
                        ✨ Feature Request
                      </SelectItem>
                      <SelectItem value="bug" className="text-base py-3 cursor-pointer hover:bg-red-50 focus:bg-red-50">
                        🐛 Bug Report
                      </SelectItem>
                      <SelectItem value="improvement" className="text-base py-3 cursor-pointer hover:bg-green-50 focus:bg-green-50">
                        🚀 Improvement
                      </SelectItem>
                      <SelectItem value="other" className="text-base py-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50">
                        💡 Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/")} 
                    className="flex-1 h-12 text-base font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Submit Feedback"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
