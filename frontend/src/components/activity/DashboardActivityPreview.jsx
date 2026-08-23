import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { api } from '../../services/api';
import { Card } from '../ui/Card';

const fetchActivity = async () => {
  const { data } = await api.get('/activity');
  return data.data.events;
};

export function DashboardActivityPreview() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['engineering-activity'],
    queryFn: fetchActivity
  });

  if (isLoading) {
    return (
      <Card className="p-6 border-[#E5E0D6] bg-[#FFFDF8] flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-[#315B45]" />
      </Card>
    );
  }

  const recentEvents = events.slice(0, 3);

  return (
    <Card className="p-6 border-[#E5E0D6] bg-[#FFFDF8] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#20211E]">Recent Engineering Activity</h3>
        <Link to="/activity" className="text-xs font-bold text-[#315B45] hover:text-[#20211E] flex items-center gap-1 transition">
          View Full <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {recentEvents.length === 0 ? (
        <p className="text-sm text-[#6F7068]">No recent activity found.</p>
      ) : (
        <div className="space-y-4 pt-2">
          {recentEvents.map((event) => (
            <div key={event.id} className="flex flex-col border-l-2 border-[#E8F0EA] pl-3 py-1">
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#C9683A]">
                {event.platform}
              </span>
              <p className="text-sm font-bold text-[#20211E] mt-0.5">{event.metadata?.title}</p>
              <span className="text-xs font-medium text-[#92928A] mt-1">
                {formatDistanceToNow(parseISO(event.timestamp), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
