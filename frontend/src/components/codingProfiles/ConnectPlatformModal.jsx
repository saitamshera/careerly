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
            className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${feedbackNotice.type === 'success'
              ? 'bg-[#E8F0EA] text-[#315B45] border border-[#D1E0D7]'
              : 'bg-[#FDECEB] text-[#B83A35] border border-[#F7CBC9]'
              }`}
          >
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#315B45]" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-[#B83A35]" />
            )}
            <span>{feedbackNotice.message}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-xs font-bold text-[#20211E] mb-1.5">
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
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition cursor-pointer ${isSelected
                      ? 'border-[#315B45] bg-[#E8F0EA] text-[#315B45] font-bold'
                      : 'border-[#E5E0D6] hover:border-[#D6D0C4] bg-[#FFFDF8] text-[#20211E]'
                      }`}
                  >
                    {plat.icon({ className: 'h-4 w-4 shrink-0' })}
                    <span className="text-xs truncate">{plat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#20211E] mb-1">
              Username / Handle / URL
            </label>
            <input
              type="text"
              required
              placeholder="e.g. tour_de_force or https://leetcode.com/u/user/"
              value={username}
              onChange={handleUsernameChange}
              onBlur={handleUsernameBlur}
              className="w-full rounded-lg border border-[#E5E0D6] bg-[#FFFDF8] px-3 py-2 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
            />
            <p className="text-[0.68rem] text-[#92928A] mt-1">
              Tip: Paste full URL or just the username handle.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#20211E] mb-1">
              Profile Link (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              className="w-full rounded-lg border border-[#E5E0D6] bg-[#FFFDF8] px-3 py-2 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
            />
          </div>

          {/* Self-report Toggle */}
          <div className="p-3 rounded-lg border border-[#E5E0D6] bg-[#F5F2EA] space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSelfReported}
                onChange={(e) => setIsSelfReported(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#315B45] rounded"
              />
              <span className="text-xs font-bold text-[#20211E]">
                Enter / override stats manually
              </span>
            </label>

            {isSelfReported && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5E0D6]">
                <div>
                  <label className="block text-[0.68rem] text-[#6F7068] mb-0.5 font-medium">Total Solved</label>
                  <input
                    type="number"
                    value={totalSolved}
                    onChange={(e) => setTotalSolved(e.target.value)}
                    className="w-full rounded-md border border-[#E5E0D6] bg-[#FFFDF8] px-2 py-1 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] text-[#6F7068] mb-0.5 font-medium">Contest Rating</label>
                  <input
                    type="number"
                    value={currentRating}
                    onChange={(e) => setCurrentRating(e.target.value)}
                    className="w-full rounded-md border border-[#E5E0D6] bg-[#FFFDF8] px-2 py-1 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
                    placeholder="e.g. 1850"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#F0ECE4] flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isPending}>
              {isPending ? 'Verifying...' : 'Save & Sync'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
