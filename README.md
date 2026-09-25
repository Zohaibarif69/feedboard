# Feedboard

A feedback board web app built with Next.js, where users can register, log in, submit feedback (features, bugs, improvements), upvote posts, and comment on them.

## Features

- Email/username + password authentication (custom session-token auth, not NextAuth)
- Create, list, and filter feedback by category and status
- Upvote feedback (one upvote per user, enforced in the database)
- Comment on feedback items
- Protected routes (`/create`, `/feedback`) via middleware + client-side guard
- Persistent login across page refreshes

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Database/ORM:** PostgreSQL + Prisma
- **UI:** Tailwind CSS, shadcn/ui (Radix primitives), lucide-react icons
- **Forms/validation:** react-hook-form, zod
- **Other:** framer-motion, sonner (toasts)

## Prerequisites

- Node.js 18+
- A PostgreSQL database (local or hosted, e.g. Supabase/Neon/Railway)

## Getting Started

1. **Clone and install dependencies**
   ```bash
   git clone <repo-url>
   cd feedboard-main
   npm install
   ```

2. **Configure environment variables**

   Create a `.env` file in the project root:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/feedboard"
   ```

3. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **(Optional) Seed sample data**
   ```bash
   npx tsx seed.ts
   ```
   This creates a test user (`test@example.com` / `password123`) and a sample feedback post.

5. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
app/
├── api/               # API routes (auth, feedback)
├── components/        # Shared components (Header, ProtectedRoute, ui/)
├── hooks/              # useAuth, useFeedback
├── create/             # New feedback form
├── feedback/[id]/      # Feedback detail + comments
├── login/, register/   # Auth pages
└── page.tsx            # Dashboard / feedback list
prisma/
└── schema.prisma      # User, Session, Feedback, Comment, Upvote models
lib/
└── prisma.ts          # Prisma client singleton
seed.ts                 # Database seed script
middleware.ts            # Route protection
```

## Data Model

- **User** — account with unique username/email
- **Session** — token + refresh token per login, with expiry
- **Feedback** — title, description, category (`feature` / `bug` / `improvement` / `other`), status (`open` / `planned` / `in_progress` / `closed`), upvote count
- **Comment** — belongs to a feedback item and a user
- **Upvote** — join table enforcing one upvote per user per feedback item
