import React from 'react';
import { Square } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function InterviewEndModal({
  show,
  onClose,
  onConfirm,
  isPending
}) {
  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      title="Conclude Interview Session?"
      subtitle="Your comprehensive Bar-Raiser performance report, scoring breakdown, and feedback will be generated based on the complete conversation."
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Continue Interview
          </Button>
          <Button variant="danger" size="sm" isLoading={isPending} onClick={onConfirm}>
            {isPending ? 'Generating Report...' : 'End & Generate Report'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
