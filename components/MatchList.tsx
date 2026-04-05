"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

type Match = {
  id: string;
  name: string;
  platform: string | null;
  updatedAt: Date;
};

export default function MatchList({ initialMatches }: { initialMatches: Match[] }) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPlatform, setNewPlatform] = useState("");
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, platform: newPlatform }),
      });

      if (!res.ok) throw new Error("Failed to create match");

      const newMatch = await res.json();
      setMatches([newMatch, ...matches]);
      setIsAdding(false);
      setNewName("");
      setNewPlatform("");
      router.push(`/app/match/${newMatch.id}`);
    } catch (error) {
      console.error(error);
      alert("Failed to create match");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Matches</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Match</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Sarah"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform (Optional)</label>
              <input
                type="text"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Hinge, Bumble"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save & Chat
            </button>
          </div>
        </form>
      )}

      {matches.length === 0 && !isAdding ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No matches yet</h3>
          <p className="text-gray-500 mt-1">Add your first match to start getting reply suggestions.</p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-4 text-blue-600 font-medium hover:underline"
          >
            Add a match
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {matches.map((match) => (
            <Link
              key={match.id}
              href={`/app/match/${match.id}`}
              className="bg-white p-5 rounded-xl shadow-sm border hover:border-blue-300 hover:shadow-md transition group"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg group-hover:text-blue-600 transition">
                  {match.name}
                </h3>
                {match.platform && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full uppercase tracking-wider font-medium">
                    {match.platform}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Last active {new Date(match.updatedAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
