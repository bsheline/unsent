import ConversationInput from "@/components/ConversationInput";
import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MatchClientView from "./MatchClientView";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const match = await prisma.match.findUnique({
    where: {
      id: params.id,
      userId: userId,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!match) {
    redirect("/app/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/app/dashboard"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          {match.name}
          {match.platform && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full uppercase tracking-wider font-medium font-normal">
              {match.platform}
            </span>
          )}
        </h1>
      </div>

      <MatchClientView matchId={match.id} initialMessages={match.messages} />
    </div>
  );
}
