"use client";

import { useState } from "react";
import { Send, Image as ImageIcon, Loader2 } from "lucide-react";

type Suggestion = {
  reply: string;
  rationale: string;
  tone: string;
};

interface ConversationInputProps {
  matchId: string;
  onSuggestions: (suggestions: Suggestion[]) => void;
}

export default function ConversationInput({ matchId, onSuggestions }: ConversationInputProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, input }),
      });

      if (!res.ok) throw new Error("Failed to get suggestions");

      const data = await res.json();
      onSuggestions(data.suggestions);
      setInput("");
    } catch (error) {
      console.error(error);
      alert("Failed to get suggestions. Make sure you are on the PRO plan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-sm border mt-6">
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste the latest message from them..."
          className="w-full min-h-[120px] p-4 pr-12 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none"
          disabled={isLoading}
        />
        <div className="absolute bottom-3 right-3 flex gap-2">
          {/* Phase 1: image input UI placeholder, functionality not fully implemented */}
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
            title="Upload screenshot (Coming soon)"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Paste the latest message they sent you. We'll generate 3 reply options based on the conversation history.
      </p>
    </form>
  );
}
