"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type SuggestionProps = {
  reply: string;
  rationale: string;
  tone: string;
};

export default function SuggestionCard({ reply, rationale, tone }: SuggestionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Asynchronously trigger style profile update
    fetch('/api/style-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: reply }),
    }).catch(() => {
      // Background request, ignore errors
    });
  };

  const getToneColor = (tone: string) => {
    const t = tone.toLowerCase();
    if (t.includes('playful')) return 'bg-pink-100 text-pink-700';
    if (t.includes('direct')) return 'bg-blue-100 text-blue-700';
    if (t.includes('warm')) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border hover:border-blue-300 transition group relative">
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getToneColor(tone)}`}>
          {tone}
        </span>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-blue-600 transition p-1"
          title="Copy reply"
        >
          {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>

      <div className="mb-4">
        <p className="text-gray-900 font-medium text-lg leading-relaxed">
          "{reply}"
        </p>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
        <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Strategy</p>
        <p className="text-sm text-gray-600">{rationale}</p>
      </div>
    </div>
  );
}
