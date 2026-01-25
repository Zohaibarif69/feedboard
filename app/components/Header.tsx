"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { LogOut, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
              <MessageSquare className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Feedback Board</h1>
              <p className="text-sm text-muted-foreground">Share ideas, vote on features</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button onClick={() => router.push("/create")}>
                  <Plus className="size-4 mr-2" />
                  New Feedback
                </Button>
                <div className="flex items-center gap-3 pl-3 border-l">
                  <div className="text-right">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="size-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={() => router.push("/login")}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}