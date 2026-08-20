import React from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export function PlacementJourneyStages({
  stages,
  currentStageKey,
  selectedStageTab,
  setSelectedStageTab
}) {
  const stageEntries = [
    { key: 'foundation', label: 'STAGE 01', title: 'Foundation', stageData: stages.foundation },
    { key: 'interview_prep', label: 'STAGE 02', title: 'Interview Preparation', stageData: stages.interview_prep },
    { key: 'placement_execution', label: 'STAGE 03', title: 'Placement Execution', stageData: stages.placement_execution }
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <div>
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#315B45] block">
            Progression Architecture
          </span>
          <h2 className="text-sm sm:text-base font-bold text-[#20211E]">
            Placement Milestones
          </h2>
        </div>
        <span className="text-xs text-[#74766F] hidden sm:inline-block">
          Stages unlock as exit criteria are fulfilled.
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {stageEntries.map(({ key, label, title, stageData }) => {
          const isSelected = selectedStageTab === key;
          const isCompleted = stageData.status === 'completed';
          const isActive = currentStageKey === key;
          const isLocked = stageData.status === 'locked';

          return (
            <Card
              key={key}
              onClick={() => setSelectedStageTab(key)}
              className={`p-4 transition cursor-pointer flex flex-col justify-between space-y-3 ${isSelected
                ? 'border-[#315B45] ring-1 ring-[#315B45]/30 bg-[#E8F0EA]/20'
                : 'hover:border-[#D7D0C4]'
                }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[0.65rem] font-mono font-bold tracking-wider text-[#74766F]">
                    {label}
                  </span>
                  <Badge variant={isCompleted ? 'green' : isActive ? 'green' : isLocked ? 'neutral' : 'orange'}>
                    {isCompleted ? 'Completed ✓' : isActive ? 'Active Stage' : isLocked ? 'Locked 🔒' : 'In Progress'}
                  </Badge>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#20211E]">
                  {title}
                </h3>
                <p className="text-xs text-[#5F625C] leading-relaxed">
                  {stageData.tagline}
                </p>
              </div>

              <div className="space-y-1.5 pt-2.5 border-t border-[#E3DED3]">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#5F625C]">Stage Progress</span>
                  <span className="text-[#315B45] font-bold font-mono">
                    {Math.round(stageData.progress)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F7F4ED] border border-[#E3DED3] overflow-hidden">
                  <div
                    className="h-full bg-[#315B45] rounded-full transition-all duration-300"
                    style={{ width: `${Math.round(stageData.progress)}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
