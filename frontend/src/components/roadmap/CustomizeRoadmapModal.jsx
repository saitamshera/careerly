import React from 'react';
import { Sliders, RefreshCw } from 'lucide-react';
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
      maxWidth="max-w-2xl"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Role
            </label>
            <input
              type="text"
              value={customForm.targetRole}
              onChange={(e) => setCustomForm({ ...customForm, targetRole: e.target.value })}
              placeholder="e.g. Software Engineer"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              required
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setCustomForm({ ...customForm, targetRole: role })}
                  className={`px-2 py-0.5 rounded-lg text-[0.65rem] font-semibold border transition cursor-pointer ${
                    customForm.targetRole === role
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Company <span className="text-[0.65rem] text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={customForm.targetCompany}
              onChange={(e) => setCustomForm({ ...customForm, targetCompany: e.target.value })}
              placeholder="e.g. Google, Amazon, Stripe"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
            />
            <p className="text-[0.68rem] text-slate-400 mt-1">
              Tailors interview and assessment patterns to this company's hiring bar.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Timeline: {customForm.monthsRemaining} Months (~{customForm.monthsRemaining * 4} Weeks)
            </label>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={customForm.monthsRemaining}
              onChange={(e) => setCustomForm({ ...customForm, monthsRemaining: Number(e.target.value) })}
              className="w-full accent-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Daily Commitment: {customForm.hoursDaily} Hours / Day
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={customForm.hoursDaily}
              onChange={(e) => setCustomForm({ ...customForm, hoursDaily: Number(e.target.value) })}
              className="w-full accent-emerald-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Weak DSA Topics / Focus Areas
          </label>
          <input
            type="text"
            value={customForm.weakTopics}
            onChange={(e) => setCustomForm({ ...customForm, weakTopics: e.target.value })}
            placeholder="e.g. Dynamic Programming, Graphs, System Design"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending} size="sm">
            Generate Tailored Roadmap
          </Button>
        </div>
      </form>
    </Modal>
  );
}
