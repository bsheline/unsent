"use client";

import { useState, useRef } from "react";
import { Send, Image as ImageIcon, Loader2, X } from "lucide-react";

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
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageBase64(dataUrl);
      setImageMediaType(file.type);
    };
    reader.readAsDataURL(file);

    // Reset file input so the same file can be uploaded again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearImage = () => {
    setImageBase64(null);
    setImageMediaType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !imageBase64) || isLoading) return;

    setIsLoading(true);
    try {
      // Extract raw base64 and mediatype if an image is provided
      let rawBase64 = null;
      let mediaType = null;

      if (imageBase64) {
        // e.g. "data:image/png;base64,iVBORw0KGgo..."
        const match = imageBase64.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.*)$/);
        if (match) {
          mediaType = match[1];
          rawBase64 = match[2];
        } else {
          // Fallback if somehow it's just raw base64
          rawBase64 = imageBase64;
          mediaType = imageMediaType || "image/jpeg";
        }
      }

      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          input,
          imageBase64: rawBase64,
          mediaType: mediaType
        }),
      });

      if (!res.ok) throw new Error("Failed to get suggestions");

      const data = await res.json();
      onSuggestions(data.suggestions);
      setInput("");
      clearImage();
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
        {imageBase64 && (
          <div className="absolute top-3 left-3 inline-block group">
            <img src={imageBase64} alt="Preview" className="h-20 w-20 object-cover rounded-md border shadow-sm" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow"
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="absolute bottom-3 right-3 flex gap-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
            title="Upload screenshot"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={(!input.trim() && !imageBase64) || isLoading}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send"
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
