import React from 'react';
import Link from 'next/link';

interface Match {
  id: string;
  name: string;
  platform?: string | null;
  updatedAt: Date;
}

interface MatchListProps {
  matches: Match[];
}

export function MatchList({ matches }: MatchListProps) {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500 mb-2">No matches yet</p>
        <p className="text-sm text-gray-400">Add a match to start getting reply suggestions</p>
      </div>
    );
  }

  const getPlatformColor = (platform?: string | null) => {
    if (!platform) return 'bg-gray-100 text-gray-600';
    const p = platform.toLowerCase();
    if (p.includes('hinge')) return 'bg-purple-100 text-purple-800';
    if (p.includes('bumble')) return 'bg-yellow-100 text-yellow-800';
    if (p.includes('tinder')) return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <Link
          href={`/app/match/${match.id}`}
          key={match.id}
          className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-sm transition-all group"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {match.name}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Last updated: {new Date(match.updatedAt).toLocaleDateString()}
              </p>
            </div>

            {match.platform && (
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPlatformColor(match.platform)}`}>
                {match.platform}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
