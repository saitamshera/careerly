import React from 'react';
import { CheckCircle2, Circle, Lock } from 'lucide-react';
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
    <section className="space-y-4">
      <div className="flex items-center justify-between pb-2">
        <div>
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Progression Architecture
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Placement Milestones
          </h2>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline-block">
          Stages unlock as exit criteria are fulfilled.
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stageEntries.map(({ key, label, title, stageData }) => {
          const isSelected = selectedStageTab === key;
          const isCompleted = stageData.status === 'completed';
          const isActive = currentStageKey === key;
          const isLocked = stageData.status === 'locked';

          return (
            <Card
              key={key}
              onClick={() => setSelectedStageTab(key)}
              className={`p-5 transition cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20 dark:bg-emerald-950/20'
                  : 'hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[0.65rem] font-mono font-bold tracking-wider text-slate-400">
                    {label}
                  </span>
                  <Badge variant={isCompleted ? 'green' : isActive ? 'green' : isLocked ? 'neutral' : 'orange'}>
                    {isCompleted ? 'Completed ✓' : isActive ? 'Active Stage' : isLocked ? 'Locked 🔒' : 'In Progress'}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {stageData.tagline}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">Stage Progress</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                    {Math.round(stageData.progress)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
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
