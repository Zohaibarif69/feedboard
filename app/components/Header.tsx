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
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-linear-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl shadow-md">
              <MessageSquare className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Feedback Board</h1>
              <p className="text-xs text-gray-500">Share ideas, vote on features</p>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button 
                  onClick={() => router.push("/create")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  <Plus className="size-4" />
                  New Feedback
                </Button>

                {/* User Info */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg"
                  >
                    <LogOut className="size-4 mr-1.5" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Button 
                onClick={() => router.push("/login")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}