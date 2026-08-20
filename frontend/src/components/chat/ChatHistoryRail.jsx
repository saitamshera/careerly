import React from 'react';
import { Search, History, Plus } from 'lucide-react';

export function ChatHistoryRail({ onOpenSearch, onTogglePanel, onNewChat }) {
  return (
    <aside className="w-10 sm:w-11 shrink-0 border-l border-[#E5E0D6] bg-[#F8F6F0] flex flex-col items-center py-3 space-y-2 select-none z-10">
      {/* Search Chats Icon */}
      <button
        type="button"
        onClick={onOpenSearch}
        title="Search chats..."
        className="h-8 w-8 rounded-lg text-[#6F7068] hover:text-[#20211E] hover:bg-[#E8F0EA] flex items-center justify-center transition cursor-pointer"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Chat History Icon */}
      <button
        type="button"
        onClick={onTogglePanel}
        title="Chat history"
        className="h-8 w-8 rounded-lg text-[#6F7068] hover:text-[#20211E] hover:bg-[#E8F0EA] flex items-center justify-center transition cursor-pointer"
      >
        <History className="h-4 w-4" />
      </button>

      {/* Plus / New Chat Icon */}
      <button
        type="button"
        onClick={onNewChat}
        title="New Chat"
        className="h-8 w-8 rounded-lg text-[#315B45] hover:text-[#20211E] hover:bg-[#E8F0EA] border border-transparent hover:border-[#D1E0D7] flex items-center justify-center transition cursor-pointer"
      >
        <Plus className="h-4 w-4" />
      </button>
    </aside>
  );
}
