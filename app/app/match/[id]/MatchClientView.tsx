"use client";

import { useState } from "react";
import ConversationInput from "@/components/ConversationInput";
import SuggestionCard from "@/components/SuggestionCard";

type Suggestion = {
  reply: string;
  rationale: string;
  tone: string;
};

type Message = {
  id: string;
  role: string;
  content: string;
};

export default function MatchClientView({ matchId, initialMessages }: { matchId: string, initialMessages: Message[] }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  // We can also implement message history view here later, for now we just show the input and suggestions

  return (
    <div>
      <ConversationInput
        matchId={matchId}
        onSuggestions={(newSuggestions) => setSuggestions(newSuggestions)}
      />

      {suggestions.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="font-semibold text-lg border-b pb-2">Suggestions</h2>
          <div className="grid gap-4">
            {suggestions.map((suggestion, idx) => (
              <SuggestionCard
                key={idx}
                reply={suggestion.reply}
                rationale={suggestion.rationale}
                tone={suggestion.tone}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
