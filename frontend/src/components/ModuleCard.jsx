import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ModuleCard({ title, description, icon: Icon, to = '#' }) {
  return (
    <Link to={to} className="block group">
      <article className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-slate-700 hover:bg-slate-900/80">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {Icon ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-amber-400">
                <Icon className="h-4.5 w-4.5" />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-amber-400">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
            )}
            <h3 className="display-font text-base font-bold text-white group-hover:text-amber-400 transition-colors">
              {title}
            </h3>
          </div>

          <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-amber-400" />
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-400 line-clamp-2">
          {description}
        </p>
      </article>
    </Link>
  );
}