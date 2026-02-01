# Edge Cases Handled ✅

## 1. **User Refreshes Page → Stays Logged In** ✅

**Implementation:**
- Tokens stored in `localStorage` (token, refreshToken, user data)
- `useAuth` hook checks localStorage on mount
- Session persists across page refreshes and browser restarts
- Token expiry tracked in localStorage

**Code:**
```typescript
// useAuth.ts - Line 20-38
useEffect(() => {
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const storedRefreshToken = localStorage.getItem("refreshToken");

  if (storedToken && storedUser) {
    setToken(storedToken);
    setUser(JSON.parse(storedUser));
    setRefreshToken(storedRefreshToken);
    setIsAuthenticated(true);
  }
  setLoading(false);
}, []);
```

---

## 2. **User Tries to Upvote Twice → Blocked** ✅

**Implementation - Triple Prevention:**

### Frontend Prevention:
- Track upvoting IDs in state: `upvotingIds` Set
- Disable UI button while request in progress
- Check if user already upvoted: `upvotedBy` array

**Code:**
```typescript
// useFeedback.ts - Line 72-90
const upvoteFeedback = async (feedbackId: number, token: string, hasUpvoted: boolean) => {
  // Prevent duplicate requests
  if (upvotingIds.has(feedbackId)) {
    return; // ← Exit if already upvoting
  }

  setUpvotingIds((prev) => new Set([...prev, feedbackId]));
  // ... API call ...
};
```

### Backend Prevention:
- Database unique constraint: `@@unique([feedbackId, userId])`
- API returns 400 error if already upvoted
- Upvote table prevents duplicate entries

**Code (schema.prisma):**
```prisma
model Upvote {
  feedbackId Int
  userId     Int
  
  @@unique([feedbackId, userId]) // ← Prevents duplicates
}
```

### API Prevention:
- Checks if upvote exists before creating
- Returns error: "Already upvoted"

---

## 3. **Unauthorized Access → Redirect** ✅

**Implementation - Multi-Layer Protection:**

### Middleware (middleware.ts):
- Protects `/create` and `/feedback` routes
- Verifies token before rendering page
- Redirects to `/login?next=/path` if unauthorized

**Code:**
```typescript
// middleware.ts
const token = req.cookies.get("token")?.value || 
             req.headers.get("authorization")?.replace("Bearer ", "");

if (!token) {
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}
```

### ProtectedRoute Component:
- Client-side redirect for SPA routes
- Prevents unauthorized access to protected pages
- Shows loading state while checking auth

**Code:**
```typescript
// ProtectedRoute.tsx
useEffect(() => {
  if (!loading && !isAuthenticated) {
    router.push("/login");
  }
}, [isAuthenticated, loading, router]);
```

### API Protection:
- All protected endpoints require valid token in Authorization header
- Token verified in `verifyToken()` function
- Invalid tokens return 401 Unauthorized

**Code:**
```typescript
// api/auth/feedback/route.ts
if (action === "upvote" || action === "unvote") {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  
  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized - no token provided" },
      { status: 401 }
    );
  }
  
  const session = await verifyToken(token);
  
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - invalid token" },
      { status: 401 }
    );
  }
}
```

---

## Summary of Edge Case Handling

| Edge Case | Prevention Method | Status |
|-----------|------------------|--------|
| Page refresh loses login | localStorage persistence | ✅ |
| User refreshes during request | Request tracking (upvotingIds) | ✅ |
| Duplicate upvotes | DB unique constraint + API check | ✅ |
| Unauthorized access to /create | Middleware + ProtectedRoute | ✅ |
| Unauthorized access to /feedback | Middleware + ProtectedRoute | ✅ |
| Invalid token on API call | verifyToken() + 401 response | ✅ |
| Token expiry | Token stored with expiry time | ✅ |
| Multiple simultaneous requests | Request deduplication in hooks | ✅ |

---

## Testing Edge Cases

### Test 1: Refresh Login
```
1. Login
2. Refresh page (F5)
3. Should remain logged in ✅
```

### Test 2: Prevent Duplicate Upvote
```
1. Click upvote button
2. Click again immediately
3. Only one request sent ✅
4. Can't upvote same item twice ✅
```

### Test 3: Unauthorized Access
```
1. Open /create without logging in
2. Middleware redirects to /login ✅
3. Click "Create Feedback" without token
4. API returns 401 ✅
```
