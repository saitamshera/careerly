import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Share2, Trash2 } from 'lucide-react';

export function ConversationMenu({ onRename, onShare, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  function handleAction(e, callback) {
    e.stopPropagation();
    setIsOpen(false);
    callback();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="p-1 rounded-md text-[#92928A] hover:text-[#20211E] hover:bg-[#E8F0EA] transition cursor-pointer"
        title="More options"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-[#FFFDF8] border border-[#E5E0D6] rounded-lg shadow-md py-1 z-30 animate-fadeIn text-xs">
          <button
            type="button"
            onClick={(e) => handleAction(e, onRename)}
            className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-[#20211E] hover:bg-[#F5F2EA] transition cursor-pointer"
          >
            <Edit2 className="h-3 w-3 text-[#6F7068]" />
            <span>Rename</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleAction(e, onShare)}
            className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-[#20211E] hover:bg-[#F5F2EA] transition cursor-pointer"
          >
            <Share2 className="h-3 w-3 text-[#315B45]" />
            <span>Share</span>
          </button>

          <div className="border-t border-[#E5E0D6] my-1" />

          <button
            type="button"
            onClick={(e) => handleAction(e, onDelete)}
            className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-[#B83A35] hover:bg-[#FDECEB] transition cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
