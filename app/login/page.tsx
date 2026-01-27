"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ Next.js router
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter(); // ✅ useRouter, not navigate

  useEffect(() => {
    // Redirect if already logged in
    if (!loading && isAuthenticated) {
      router.push("/"); // ✅ use router.push
    }
  }, [isAuthenticated, loading, router]); // ✅ include router, not navigate

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, email); // login updates auth state
    toast.success("Logged in successfully!");
    router.push("/"); // ✅ navigate after login
  };

  if (loading) return <div>Loading...</div>; // show while checking auth

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6"
      >
        <h1 className="text-2xl font-bold text-center">Login</h1>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
    </div>
  );
}
