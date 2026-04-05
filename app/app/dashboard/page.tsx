import MatchList from "@/components/MatchList";
import prisma from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard - Dating Assistant",
};

export default async function DashboardPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || `${userId}@example.com`;

  // Ensure user exists in our DB, create if not
  const dbUser = await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: email,
      plan: "FREE"
    }
  });

  const matches = await prisma.match.findMany({
    where: { userId: dbUser.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      platform: true,
      updatedAt: true,
    }
  });

  return <MatchList initialMatches={matches} />;
}
