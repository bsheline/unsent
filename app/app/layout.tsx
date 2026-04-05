import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { MessageCircle, User } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/app/dashboard" className="font-bold text-xl flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-500" />
            <span>Assistant</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/app/dashboard"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/app/profile"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <User className="w-4 h-4" />
              Profile Review
            </Link>
            <UserButton afterSignOutUrl="/" />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
