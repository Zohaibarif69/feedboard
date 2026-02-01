import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/create", "/feedback"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if the path is protected
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (!isProtected) {
    return NextResponse.next();
  }

  // Get token from cookie or Authorization header
  const token =
    req.cookies.get("token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    // Redirect to login page with next parameter
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Verify token with API
  try {
    const response = await fetch(
      new URL("/api/auth?action=verify", req.url).toString(),
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      // Token is invalid, redirect to login
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // Token is valid, allow request to proceed
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware token verification error:", error);
    // On error, redirect to login
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/create/:path*", "/feedback/:path*"],
};
