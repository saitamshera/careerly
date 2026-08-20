import React, { useRef, useEffect } from 'react';
import { X, Plus, History } from 'lucide-react';
import { Button } from '../ui/Button';
import { ChatSearch } from './ChatSearch';
import { ConversationList } from './ConversationList';

export function ChatHistoryPanel({
  conversations = [],
  activeConversationId,
  searchQuery,
  onSearchChange,
  onClearSearch,
  focusSearchTrigger,
  isLoading,
  onClose,
  onNewChat,
  onSelectConversation,
  onRename,
  onShare,
  onDelete
}) {
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (focusSearchTrigger) {
      searchInputRef.current?.focus();
    }
  }, [focusSearchTrigger]);

  return (
    <div className="h-full flex flex-col bg-[#F5F2EA] border-l border-[#E5E0D6] select-none">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-[#E5E0D6] flex items-center justify-between shrink-0 bg-[#F5F2EA]">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[#315B45]" />
          <h3 className="text-xs sm:text-sm font-bold text-[#20211E] tracking-tight">
            Chat History
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-[#92928A] hover:text-[#20211E] hover:bg-[#E8F0EA] transition cursor-pointer"
          title="Close history"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Controls: Search followed by New Chat */}
      <div className="p-3 space-y-2 border-b border-[#E5E0D6] bg-[#F5F2EA] shrink-0">
        {/* Search Field */}
        <ChatSearch
          inputRef={searchInputRef}
          value={searchQuery}
          onChange={onSearchChange}
          onClear={onClearSearch}
        />

        {/* + New Chat Button */}
        <Button
          type="button"
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={onNewChat}
          className="w-full justify-center shadow-2xs text-xs font-semibold py-1.5"
        >
          New Chat
        </Button>
      </div>

      {/* Grouped Conversation List */}
      <div className="flex-1 overflow-y-auto p-2.5 scroll-smooth">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          searchQuery={searchQuery}
          isLoading={isLoading}
          onSelectConversation={onSelectConversation}
          onRename={onRename}
          onShare={onShare}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
