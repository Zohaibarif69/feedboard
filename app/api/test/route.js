import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await prisma.testUser.create({
    data: { name: "IT FINALLY WORKS" },
  });

  return Response.json(user);
}
