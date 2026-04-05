import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface SuggestionCardProps {
  reply: string;
  rationale: string;
  tone: string;
}

export function SuggestionCard({ reply, rationale, tone }: SuggestionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getToneBadgeColor = (toneString: string) => {
    const t = toneString.toLowerCase();
    if (t.includes('playful') || t.includes('funny') || t.includes('joke')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (t.includes('direct') || t.includes('straight')) return 'bg-red-100 text-red-800 border-red-200';
    if (t.includes('warm') || t.includes('friendly') || t.includes('kind')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (t.includes('flirty')) return 'bg-pink-100 text-pink-800 border-pink-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border ${getToneBadgeColor(tone)}`}>
            {tone}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Copy reply to clipboard"
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-600" />
                <span className="text-green-600">Copied</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="mb-4">
          <p className="text-lg font-medium text-gray-900 leading-relaxed whitespace-pre-wrap">
            "{reply}"
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 border border-gray-100">
          <p><strong>Rationale:</strong> {rationale}</p>
        </div>
      </div>
    </div>
  );
}
