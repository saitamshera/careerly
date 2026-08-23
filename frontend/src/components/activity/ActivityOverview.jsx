import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { Card, CardHeader } from '../ui/Card';
import { ActivityCalendar } from './ActivityCalendar';

const fetchActivity = async () => {
  const { data } = await api.get('/activity');
  return data.data.events;
};

export function ActivityOverview() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['engineering-activity'],
    queryFn: fetchActivity
  });

  const stats = useMemo(() => {
    let totalActivities = 0;
    const dateSet = new Set();
    const platformBreakdown = { leetcode: 0, github: 0, careerly: 0, applications: 0 };

    events.forEach(e => {
      const count = e.metadata?.count || 1;
      totalActivities += count;
      dateSet.add(format(parseISO(e.timestamp), 'yyyy-MM-dd'));
      if (platformBreakdown[e.platform] !== undefined) {
        platformBreakdown[e.platform] += count;
      }
    });

    const activeDates = Array.from(dateSet).sort((a, b) => new Date(b) - new Date(a));
    
    let currentStreak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    
    if (activeDates.includes(today) || activeDates.includes(yesterday)) {
      currentStreak = 1;
      let checkDate = activeDates.includes(today) ? new Date(today) : new Date(yesterday);
      
      for (let i = 1; i < activeDates.length; i++) {
        const prevDate = new Date(activeDates[i]);
        if (differenceInDays(checkDate, prevDate) === 1) {
          currentStreak++;
          checkDate = prevDate;
        } else if (differenceInDays(checkDate, prevDate) === 0) {
          continue;
        } else {
          break;
        }
      }
    }

    return {
      totalActivities,
      activeDays: activeDates.length,
      currentStreak,
      platformBreakdown
    };
  }, [events]);

  if (isLoading) {
    return (
      <Card className="p-4 space-y-4">
        <CardHeader title="Activity Overview" />
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-[#315B45]" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4 border-[#E5E0D6] bg-[#FFFDF8]">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[#20211E] tracking-tight">Engineering Activity</h3>
        <Link to="/activity" className="text-[0.65rem] font-bold text-[#315B45] hover:text-[#20211E] flex items-center gap-1 uppercase tracking-wider transition">
          View Full <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex gap-4 text-sm font-medium text-[#20211E]">
        <div>
          <span className="font-bold text-[#315B45]">{stats.totalActivities}</span>
          <span className="text-[#6F7068] text-xs ml-1">total</span>
        </div>
        <div>
          <span className="font-bold text-[#315B45]">{stats.activeDays}</span>
          <span className="text-[#6F7068] text-xs ml-1">days</span>
        </div>
        <div>
          <span className="font-bold text-[#C9683A]">{stats.currentStreak}</span>
          <span className="text-[#6F7068] text-xs ml-1">streak</span>
        </div>
      </div>

      <div className="pt-2">
        <ActivityCalendar 
          events={events} 
          onDayClick={() => {}} 
        />
      </div>

      <div className="pt-2 flex flex-wrap gap-3 border-t border-[#F0ECE4] text-xs font-medium text-[#6F7068]">
        <div>LeetCode: <span className="text-[#20211E] font-bold">{stats.platformBreakdown.leetcode}</span></div>
        <div>GitHub: <span className="text-[#20211E] font-bold">{stats.platformBreakdown.github}</span></div>
        <div>Careerly: <span className="text-[#20211E] font-bold">{stats.platformBreakdown.careerly}</span></div>
        <div>Applications: <span className="text-[#20211E] font-bold">{stats.platformBreakdown.applications}</span></div>
      </div>
    </Card>
  );
}
