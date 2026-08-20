import React from 'react';
import { Paperclip, FileText } from 'lucide-react';
import { ConversationMenu } from './ConversationMenu';

function formatItemTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ConversationListItem({
  conversation,
  isActive,
  onSelect,
  onRename,
  onShare,
  onDelete
}) {
  const timeLabel = formatItemTime(conversation.updatedAt || conversation.createdAt);

  return (
    <div
      onClick={onSelect}
      className={`group relative p-2.5 rounded-lg border transition text-xs flex flex-col gap-1 cursor-pointer select-none ${
        isActive
          ? 'border-[#315B45] bg-[#E8F0EA]'
          : 'border-transparent hover:border-[#E5E0D6] hover:bg-[#F5F2EA] bg-[#FFFDF8]'
      }`}
    >
      {/* Title & Timestamp Row */}
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <span
          className={`font-semibold truncate text-xs flex-1 ${
            isActive ? 'text-[#20211E]' : 'text-[#20211E]'
          }`}
          title={conversation.title}
        >
          {conversation.title || 'New Conversation'}
        </span>

        <span className="text-[0.65rem] text-[#92928A] shrink-0 font-mono">
          {timeLabel}
        </span>
      </div>

      {/* Preview & Actions Row */}
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {conversation.hasAttachment && (
            <span className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-[#315B45] bg-[#D6E3D9] px-1.5 py-0.5 rounded shrink-0">
              <Paperclip className="h-2.5 w-2.5" />
              <span>Doc</span>
            </span>
          )}
          <p className="text-[0.7rem] text-[#6F7068] truncate leading-tight">
            {conversation.preview || 'No messages yet'}
          </p>
        </div>

        <div className="shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition">
          <ConversationMenu
            onRename={() => onRename(conversation)}
            onShare={() => onShare(conversation)}
            onDelete={() => onDelete(conversation)}
          />
        </div>
      </div>
    </div>
  );
}
