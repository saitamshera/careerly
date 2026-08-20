import React from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function RoadmapWeekAccordion({
  week,
  isExpanded,
  onToggleExpand,
  activeRoadmap,
  onToggleTask
}) {
  const weekCompletedCount = (week.tasks || []).filter(
    (t) => t.completed || activeRoadmap?.completedTaskIds?.includes(t.id)
  ).length;
  const isAllCompleted = week.tasks?.length > 0 && weekCompletedCount === week.tasks.length;

  return (
    <Card
      padding="none"
      className={`overflow-hidden transition duration-150 ${isAllCompleted
        ? 'border-[#D1E0D7] bg-[#E8F0EA]/10'
        : 'border-[#E3DED3]'
        }`}
    >
      {/* Header Row */}
      <div
        onClick={onToggleExpand}
        className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-[#F7F4ED] transition select-none"
      >
        <div className="flex items-start md:items-center gap-3">
          <Badge variant={isAllCompleted ? 'green' : 'neutral'} size="md">
            WEEK {week.weekNumber}
          </Badge>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-[#20211E]">{week.title}</h3>
              <span className="text-xs text-[#74766F] font-medium">({week.phase})</span>
            </div>
            <p className="text-xs text-[#5F625C] mt-0.5">{week.objective}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <Badge variant={week.priority === 'High' ? 'orange' : week.priority === 'Critical' ? 'red' : 'neutral'} size="sm">
            {week.priority}
          </Badge>
          <span className="text-xs font-semibold text-[#74766F] font-mono">
            {week.estimatedHours || 18}h
          </span>
          <span className={`text-xs font-bold font-mono ${isAllCompleted ? 'text-[#315B45]' : 'text-[#20211E]'}`}>
            {weekCompletedCount}/{week.tasks?.length || 0}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-[#74766F]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#74766F]" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-4 pt-2.5 border-t border-[#E3DED3] space-y-3">
          {/* Actionable Tasks */}
          <div className="space-y-2">
            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#74766F] block">
              Actionable Tasks:
            </span>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {(week.tasks || []).map((task) => {
                const isDone = task.completed || activeRoadmap?.completedTaskIds?.includes(task.id);
                return (
                  <div
                    key={task.id}
                    onClick={() => onToggleTask(task.id)}
                    className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition select-none ${isDone
                      ? 'border-[#D1E0D7] bg-[#E8F0EA]/40 text-[#20211E]'
                      : 'border-[#E3DED3] bg-[#FFFDF8] hover:border-[#D7D0C4]'
                      }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 shrink-0 focus:outline-none cursor-pointer"
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-[#315B45]" />
                      ) : (
                        <Circle className="h-4 w-4 text-[#74766F] hover:text-[#315B45]" />
                      )}
                    </button>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral" size="sm">
                          {task.category}
                        </Badge>
                        <span className="text-[0.68rem] text-[#74766F] font-medium">
                          {task.estimatedHours || 3}h
                        </span>
                      </div>
                      <p className={`text-xs font-medium leading-relaxed ${isDone ? 'line-through text-[#74766F]' : 'text-[#20211E]'}`}>
                        {task.task}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
