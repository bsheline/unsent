import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ProfileReviewerProps {
  onReview: (bio: string) => Promise<{ suggestions: string[]; critique: string }>;
}

export function ProfileReviewer({ onReview }: ProfileReviewerProps) {
  const [bio, setBio] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<{ suggestions: string[]; critique: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bio.trim()) return;

    setIsReviewing(true);
    try {
      const data = await onReview(bio);
      setResult(data);
    } catch (error) {
      console.error('Failed to review profile:', error);
      // Fallback or error state handling could go here
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-indigo-50 border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
            <Sparkles size={20} className="text-indigo-600" />
            Bio Reviewer
          </h2>
          <p className="text-sm text-indigo-700 mt-1">
            Paste your current dating app bio and get actionable feedback plus rewrite suggestions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <label htmlFor="bio-input" className="block text-sm font-medium text-gray-700 mb-2">
            Your Current Bio
          </label>
          <textarea
            id="bio-input"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="I like hiking, dogs, and watching The Office. Looking for someone who doesn't take themselves too seriously..."
            className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
            disabled={isReviewing}
          />

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isReviewing || !bio.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isReviewing ? 'Analyzing...' : 'Review My Bio'}
              {!isReviewing && <ArrowRight size={16} />}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900">Feedback</h3>
            </div>
            <div className="p-4 text-gray-700 leading-relaxed">
              {result.critique}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 px-1">Suggested Rewrites</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {result.suggestions.map((suggestion, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-indigo-300 transition-colors">
                  <p className="text-gray-800 whitespace-pre-wrap">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
