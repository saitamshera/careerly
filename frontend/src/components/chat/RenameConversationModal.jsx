import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function RenameConversationModal({
  conversation,
  isOpen,
  isLoading,
  onClose,
  onSave
}) {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (conversation) {
      setTitle(conversation.title || '');
    }
  }, [conversation]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || isLoading) return;
    onSave(title.trim());
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rename Conversation"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block text-[0.68rem] font-bold uppercase tracking-wider text-[#92928A] mb-1">
            Conversation Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Resume Optimization"
            autoFocus
            required
            className="w-full bg-[#FFFDF8] border border-[#E5E0D6] rounded-lg px-3 py-2 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isLoading}
            disabled={!title.trim() || isLoading}
          >
            Save Title
          </Button>
        </div>
      </form>
    </Modal>
  );
}
