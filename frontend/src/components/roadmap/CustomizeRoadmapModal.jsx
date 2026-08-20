import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

const QUICK_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'DevOps Engineer'
];

export function CustomizeRoadmapModal({
  isOpen,
  onClose,
  customForm,
  setCustomForm,
  onSubmit,
  isPending
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Preparation Roadmap"
      subtitle="Configure target roles, available study hours, and technical focus areas."
      maxWidth="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-[#20211E] mb-1">
              Target Role
            </label>
            <input
              type="text"
              value={customForm.targetRole}
              onChange={(e) => setCustomForm({ ...customForm, targetRole: e.target.value })}
              placeholder="e.g. Software Engineer"
              className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
              required
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setCustomForm({ ...customForm, targetRole: role })}
                  className={`px-2 py-0.5 rounded-md text-[0.65rem] font-semibold border transition cursor-pointer ${customForm.targetRole === role
                    ? 'bg-[#E8F0EA] text-[#315B45] border-[#D1E0D7] font-bold'
                    : 'bg-[#F7F4ED] text-[#5F625C] border-[#E3DED3] hover:border-[#D7D0C4]'
                    }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#20211E] mb-1">
              Target Company <span className="text-[0.65rem] text-[#74766F] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={customForm.targetCompany}
              onChange={(e) => setCustomForm({ ...customForm, targetCompany: e.target.value })}
              placeholder="e.g. Google, Amazon, Stripe"
              className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
            />
            <p className="text-[0.68rem] text-[#74766F] mt-1">
              Tailors interview and assessment patterns to this company.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-[#20211E] mb-1">
              Timeline: {customForm.monthsRemaining} Months (~{customForm.monthsRemaining * 4} Weeks)
            </label>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={customForm.monthsRemaining}
              onChange={(e) => setCustomForm({ ...customForm, monthsRemaining: Number(e.target.value) })}
              className="w-full accent-[#315B45]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#20211E] mb-1">
              Daily Commitment: {customForm.hoursDaily} Hours / Day
            </label>
            <input
              type="range"
              min="1"
              max="12"
              step="1"
              value={customForm.hoursDaily}
              onChange={(e) => setCustomForm({ ...customForm, hoursDaily: Number(e.target.value) })}
              className="w-full accent-[#315B45]"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-[#E3DED3] flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isPending}>
            {isPending ? 'Generating...' : 'Save & Recalibrate'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
