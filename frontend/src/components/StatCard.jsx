import { TrendingUp } from 'lucide-react';

export function StatCard({ label, value, hint, icon: Icon, trend }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-slate-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <div className="display-font mt-1.5 text-2xl font-bold tracking-tight text-white">{value}</div>
        </div>

        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-amber-400">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2.5">
        <p className="text-xs text-slate-400 truncate max-w-[80%]">{hint}</p>
        {trend && (
          <span className="text-[0.68rem] font-semibold text-emerald-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}