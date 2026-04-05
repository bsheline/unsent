import React, { useState, useRef } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';

interface ConversationInputProps {
  onSubmit: (input: string, imageBase64?: string) => void;
  isLoading?: boolean;
}

export function ConversationInput({ onSubmit, isLoading = false }: ConversationInputProps) {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImage(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !image) return;

    // Pass the base64 string without the prefix (e.g. data:image/png;base64,)
    const imageBase64 = image ? image.split(',')[1] : undefined;
    onSubmit(text, imageBase64);
  };

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <form onSubmit={handleSubmit} className="p-4">
        <label htmlFor="conversation-text" className="block text-sm font-medium text-gray-700 mb-2">
          Paste conversation text or screenshot
        </label>

        <div className="relative">
          <textarea
            id="conversation-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={handlePaste}
            placeholder="Them: hey!&#10;Me: hi there&#10;Them: what are you up to?"
            className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
            disabled={isLoading}
          />
        </div>

        {image && (
          <div className="mt-3 relative inline-block">
            <div className="relative rounded-lg overflow-hidden border border-gray-200">
              <img src={image} alt="Pasted screenshot" className="max-h-48 object-contain" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-1 right-1 bg-gray-900/60 text-white rounded-full p-1 hover:bg-gray-900/80 transition-colors"
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="image-upload"
              disabled={isLoading}
            />
            <label
              htmlFor="image-upload"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <ImageIcon size={16} />
              <span>Upload Image</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!text.trim() && !image)}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Generating...' : 'Get Suggestions'}
          </button>
        </div>
      </form>
    </div>
  );
}
