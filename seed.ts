import { prisma } from "./lib/prisma";
import crypto from "crypto";

async function hashPassword(password: string): Promise<string> {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log(" Starting seed...");

  // Create a test user
  const hashedPassword = await hashPassword("password123");
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      username: "testuser",
      email: "test@example.com",
      password: hashedPassword,
    },
  });

  console.log(` User created: ${user.username}`);

  // Create test feedback
  const feedback = await prisma.feedback.create({
    data: {
      title: "Add dark mode",
      description: "It would be great to have a dark mode for the feedback board",
      category: "feature",
      status: "open",
      authorId: user.id,
    },
  });

  console.log(` Feedback created: ${feedback.title}`);

  // Create another feedback
  const feedback2 = await prisma.feedback.create({
    data: {
      title: "Fix login bug",
      description: "Users are experiencing issues logging in on mobile",
      category: "bug",
      status: "in_progress",
      authorId: user.id,
    },
  });

  console.log(` Feedback created: ${feedback2.title}`);

  console.log(" Seed completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
