"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

export default function ProfileReviewer() {
  const [bio, setBio] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bio.trim() || isLoading) return;

    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/profile/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });

      if (!res.ok) throw new Error("Failed to get review");

      const data = await res.json();
      setFeedback(data.feedback);
    } catch (error) {
      console.error(error);
      alert("Failed to get profile review. Make sure you are on the PRO plan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-xl font-bold mb-4">Profile Bio Review</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Paste your current dating app bio below. We'll analyze it for engagement potential, red flags, and suggest improvements.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Paste your bio here..."
            className="w-full min-h-[150px] p-4 border rounded-lg resize-y focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!bio.trim() || isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Get Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {feedback && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200">
          <h3 className="font-semibold text-lg mb-4 text-blue-900">Review Feedback</h3>
          <div className="prose prose-blue max-w-none text-gray-700 whitespace-pre-wrap">
            {feedback}
          </div>
        </div>
      )}
    </div>
  );
}
