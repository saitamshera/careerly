import React from 'react';
import { Search, X } from 'lucide-react';

export function ChatSearch({ value, onChange, onClear, inputRef }) {
  return (
    <div className="relative flex items-center">
      <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#92928A] pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search chats..."
        className="w-full bg-[#FFFDF8] border border-[#E5E0D6] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[#20211E] placeholder:text-[#92928A] outline-none focus:border-[#315B45] transition"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 text-[#92928A] hover:text-[#20211E] p-0.5 rounded cursor-pointer"
          title="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
