import React, { useMemo } from 'react';
import { ConversationListItem } from './ConversationListItem';

function getTimeGroup(dateStr) {
  if (!dateStr) return 'OLDER';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'OLDER';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfSevenDays = startOfToday - 7 * 24 * 60 * 60 * 1000;

  const itemTime = d.getTime();

  if (itemTime >= startOfToday) {
    return 'TODAY';
  }
  if (itemTime >= startOfYesterday) {
    return 'YESTERDAY';
  }
  if (itemTime >= startOfSevenDays) {
    return 'PREVIOUS 7 DAYS';
  }
  return 'OLDER';
}

export function ConversationList({
  conversations = [],
  activeConversationId,
  searchQuery = '',
  isLoading = false,
  onSelectConversation,
  onRename,
  onShare,
  onDelete
}) {
  // Filter conversations by title, preview, or attachment name
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((c) => {
      const title = (c.title || '').toLowerCase();
      const preview = (c.preview || '').toLowerCase();
      const attachment = (c.attachmentName || '').toLowerCase();
      return title.includes(q) || preview.includes(q) || attachment.includes(q);
    });
  }, [conversations, searchQuery]);

  // Group filtered conversations
  const grouped = useMemo(() => {
    const groups = {
      TODAY: [],
      YESTERDAY: [],
      'PREVIOUS 7 DAYS': [],
      OLDER: []
    };

    filtered.forEach((conv) => {
      const g = getTimeGroup(conv.updatedAt || conv.createdAt);
      if (groups[g]) {
        groups[g].push(conv);
      } else {
        groups.OLDER.push(conv);
      }
    });

    return groups;
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="py-8 text-center text-xs text-[#92928A]">
        Loading conversations...
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#92928A]">
        {searchQuery ? 'No conversations found' : 'No previous conversations'}
      </div>
    );
  }

  const order = ['TODAY', 'YESTERDAY', 'PREVIOUS 7 DAYS', 'OLDER'];

  return (
    <div className="space-y-4 pb-4">
      {order.map((groupKey) => {
        const items = grouped[groupKey];
        if (!items || items.length === 0) return null;

        return (
          <div key={groupKey} className="space-y-1.5">
            <h4 className="px-1 text-[0.65rem] font-bold tracking-wider uppercase text-[#92928A]">
              {groupKey}
            </h4>

            <div className="space-y-1">
              {items.map((conv) => {
                const convId = conv._id || conv.id;
                const isActive = convId === activeConversationId;

                return (
                  <ConversationListItem
                    key={convId}
                    conversation={conv}
                    isActive={isActive}
                    onSelect={() => onSelectConversation(conv)}
                    onRename={onRename}
                    onShare={onShare}
                    onDelete={onDelete}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
