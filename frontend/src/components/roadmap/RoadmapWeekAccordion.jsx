import React from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Clock, ExternalLink } from 'lucide-react';
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
      className={`overflow-hidden transition duration-150 ${
        isAllCompleted
          ? 'border-emerald-200 bg-emerald-50/10 dark:bg-emerald-950/10'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Header Row */}
      <div
        onClick={onToggleExpand}
        className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition select-none"
      >
        <div className="flex items-start md:items-center gap-3">
          <Badge variant={isAllCompleted ? 'green' : 'neutral'} size="md">
            WEEK {week.weekNumber}
          </Badge>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{week.title}</h3>
              <span className="text-xs text-slate-400 font-medium">({week.phase})</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{week.objective}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <Badge variant={week.priority === 'High' ? 'orange' : week.priority === 'Critical' ? 'red' : 'neutral'} size="sm">
            {week.priority}
          </Badge>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            {week.estimatedHours || 18}h
          </span>
          <span className={`text-xs font-bold font-mono ${isAllCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
            {weekCompletedCount}/{week.tasks?.length || 0}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
          {/* Actionable Tasks */}
          <div className="space-y-2">
            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 block">
              Actionable Tasks:
            </span>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {(week.tasks || []).map((task) => {
                const isDone = task.completed || activeRoadmap?.completedTaskIds?.includes(task.id);
                return (
                  <div
                    key={task.id}
                    onClick={() => onToggleTask(task.id)}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition select-none ${
                      isDone
                        ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-800/60 dark:text-emerald-200'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 shrink-0 focus:outline-none cursor-pointer"
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="h-4.5 w-4.5 text-slate-300 hover:text-emerald-600 dark:text-slate-600 dark:hover:text-emerald-400" />
                      )}
                    </button>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral" size="sm">
                          {task.category}
                        </Badge>
                        <span className="text-[0.68rem] text-slate-400 font-medium">
                          {task.estimatedHours || 3}h
                        </span>
                      </div>
                      <p className={`text-xs font-bold leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {task.title}
                      </p>
                      <p className="text-[0.7rem] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Curated Study Resources */}
          {week.resources && week.resources.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 block">
                Recommended Study Resources:
              </span>
              <div className="flex flex-wrap gap-2">
                {week.resources.map((res, i) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-xs font-semibold text-slate-700 hover:text-emerald-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition"
                  >
                    <span>{res.title}</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
