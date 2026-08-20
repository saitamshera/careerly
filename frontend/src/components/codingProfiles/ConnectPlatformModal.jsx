import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { extractCleanHandle } from '../../utils/sanitizeHandle';
import { PLATFORMS_CONFIG } from '../../config/platforms.config';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function ConnectPlatformModal({
  show,
  onClose,
  selectedPlatform,
  setSelectedPlatform,
  username,
  setUsername,
  profileUrl,
  setProfileUrl,
  isSelfReported,
  setIsSelfReported,
  totalSolved,
  setTotalSolved,
  easySolved,
  setEasySolved,
  mediumSolved,
  setMediumSolved,
  hardSolved,
  setHardSolved,
  currentRating,
  setCurrentRating,
  maxRating,
  setMaxRating,
  globalRank,
  setGlobalRank,
  feedbackNotice,
  isPending,
  onSubmit
}) {
  const handleUsernameChange = (e) => {
    const val = e.target.value;
    setUsername(val);
  };

  const handleUsernameBlur = () => {
    const clean = extractCleanHandle(username);
    if (clean && clean !== username) {
      setUsername(clean);
      if (!profileUrl && selectedPlatform) {
        const plat = PLATFORMS_CONFIG.find((p) => p.id === selectedPlatform);
        if (plat?.baseUrl) {
          setProfileUrl(`${plat.baseUrl}${clean}`);
        }
      }
    }
  };
  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      title="Connect Coding Profile"
      subtitle="Sync your real contest ratings, problems solved, and activity telemetry."
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {feedbackNotice && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
              feedbackNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{feedbackNotice.message}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              Select Platform
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLATFORMS_CONFIG.map((plat) => {
                const isSelected = selectedPlatform === plat.id;
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => setSelectedPlatform(plat.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {plat.icon({ className: 'h-4 w-4 shrink-0' })}
                    <span className="text-xs truncate">{plat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Username / Handle
              </label>
              <input
                type="text"
                required
                placeholder="e.g. your_handle or profile link"
                value={username}
                onChange={handleUsernameChange}
                onBlur={handleUsernameBlur}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Profile URL <span className="text-[0.65rem] text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Self Reported / Manual Stats Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSelfReported}
                onChange={(e) => setIsSelfReported(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-xs">Self-report / Manually enter stats</span>
            </label>
          </div>

          {isSelfReported && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[0.65rem] font-bold text-slate-500 mb-1">Total</label>
                  <input
                    type="number"
                    value={totalSolved}
                    onChange={(e) => setTotalSolved(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-bold text-emerald-600 mb-1">Easy</label>
                  <input
                    type="number"
                    value={easySolved}
                    onChange={(e) => setEasySolved(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-bold text-amber-600 mb-1">Medium</label>
                  <input
                    type="number"
                    value={mediumSolved}
                    onChange={(e) => setMediumSolved(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-bold text-rose-600 mb-1">Hard</label>
                  <input
                    type="number"
                    value={hardSolved}
                    onChange={(e) => setHardSolved(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[0.65rem] font-bold text-slate-500 mb-1">Rating</label>
                  <input
                    type="number"
                    value={currentRating}
                    onChange={(e) => setCurrentRating(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-bold text-slate-500 mb-1">Global Rank</label>
                  <input
                    type="number"
                    value={globalRank}
                    onChange={(e) => setGlobalRank(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isPending}>
              Connect & Sync
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
