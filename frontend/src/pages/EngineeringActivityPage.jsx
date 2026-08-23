import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isSameDay, differenceInDays, parseISO } from 'date-fns';
import { Activity, GitCommit, Code2, Target, Briefcase, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ActivityCalendar } from '../components/activity/ActivityCalendar';

const fetchActivity = async () => {
  const { data } = await api.get('/activity');
  return data.data.events;
};

export function EngineeringActivityPage() {
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['engineering-activity'],
    queryFn: fetchActivity
  });

  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter(e => e.platform === filter);
  }, [events, filter]);

  const stats = useMemo(() => {
    let totalActivities = 0;
    const dateSet = new Set();
    const platformBreakdown = { leetcode: 0, github: 0, careerly: 0, applications: 0 };

    filteredEvents.forEach(e => {
      const count = e.metadata?.count || 1;
      totalActivities += count;
      dateSet.add(format(parseISO(e.timestamp), 'yyyy-MM-dd'));
      if (platformBreakdown[e.platform] !== undefined) {
        platformBreakdown[e.platform] += count;
      }
    });

    const activeDates = Array.from(dateSet).sort((a, b) => new Date(b) - new Date(a));
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    
    // Streak logic
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

    if (activeDates.length > 0) {
      tempStreak = 1;
      longestStreak = 1;
      for (let i = 0; i < activeDates.length - 1; i++) {
        const d1 = new Date(activeDates[i]);
        const d2 = new Date(activeDates[i+1]);
        if (differenceInDays(d1, d2) === 1) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else if (differenceInDays(d1, d2) > 1) {
          tempStreak = 1;
        }
      }
    }

    let insightsStr = '';
    if (activeDates.length > 0) {
      if (platformBreakdown.careerly < 5 && platformBreakdown.leetcode > 10) {
        insightsStr = 'You are consistently practicing coding, but consider increasing your mock interview activity on Careerly to ensure balanced readiness.';
      } else if (totalActivities > 10 && platformBreakdown.applications === 0) {
        insightsStr = 'You have solid preparation activity, but no recent applications tracked. Consider expanding your top-of-funnel pipeline.';
      } else if (currentStreak >= 3) {
        insightsStr = `Great momentum! You are on a ${currentStreak}-day streak. Keep it up.`;
      } else {
        insightsStr = 'Your verified activity looks good. Focus on consistent daily effort.';
      }
    } else {
      insightsStr = 'No verified activity yet. Start by linking your platforms or completing a mock interview.';
    }

    return {
      totalActivities,
      activeDays: activeDates.length,
      currentStreak,
      longestStreak,
      platformBreakdown,
      insightsStr
    };
  }, [filteredEvents]);

  const handleDayClick = (day, dayEvents) => {
    setSelectedDate(day);
    setSelectedDayEvents(dayEvents);
  };

  const filters = [
    { id: 'all', label: 'All Platforms', icon: Activity },
    { id: 'careerly', label: 'Careerly', icon: Target },
    { id: 'leetcode', label: 'LeetCode', icon: Code2 },
    { id: 'github', label: 'GitHub', icon: GitCommit },
    { id: 'applications', label: 'Applications', icon: Briefcase }
  ];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#315B45]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-[#F7E7DD] border border-[#F0D0BF] text-[#C9683A] p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold">Could not load activity</h3>
            <p className="text-sm mt-1">Please try again later or contact support.</p>
          </div>
        </div>
      </div>
    );
  }

  // Group recent events by date (limit to 10 dates max)
  const recentGroups = {};
  const sortedEvents = [...filteredEvents].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  for (const event of sortedEvents) {
    const d = format(parseISO(event.timestamp), 'yyyy-MM-dd');
    if (!recentGroups[d]) recentGroups[d] = [];
    recentGroups[d].push(event);
  }
  const recentGroupKeys = Object.keys(recentGroups).slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[#20211E] tracking-tight">Engineering Activity</h1>
        <p className="text-[#6F7068] font-medium mt-1">Your verified activity across all preparation platforms.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => {
              setFilter(f.id);
              setSelectedDate(null);
              setSelectedDayEvents([]);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              filter === f.id 
                ? 'bg-[#315B45] text-[#FFFDF8]' 
                : 'bg-[#FFFDF8] border border-[#E5E0D6] text-[#6F7068] hover:border-[#315B45] hover:text-[#20211E]'
            }`}
          >
            <f.icon className="h-4 w-4" />
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Calendar and Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-[#E5E0D6] bg-[#FFFDF8]">
            <ActivityCalendar 
              events={filteredEvents} 
              onDayClick={handleDayClick} 
              selectedDate={selectedDate} 
            />
          </Card>

          {/* Daily Panel if selected */}
          {selectedDate && (
            <Card className="p-6 border-[#315B45] bg-[#F8F6F0] shadow-sm animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-[#E5E0D6] pb-4 mb-4">
                <h3 className="font-bold text-[#20211E]">{format(selectedDate, 'MMMM d, yyyy')}</h3>
                <Badge variant="neutral">{selectedDayEvents.length} activities</Badge>
              </div>
              
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-[#6F7068]">No verified activity on this day.</p>
              ) : (
                <div className="space-y-4">
                  {selectedDayEvents.map(event => (
                    <div key={event.id} className="flex gap-4">
                      <div className="w-16 pt-1 text-xs font-bold text-[#92928A] shrink-0">
                        {format(parseISO(event.timestamp), 'h:mm a')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#C9683A]">
                            {event.platform}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-[#20211E] mt-0.5">{event.metadata?.title || 'Activity'}</p>
                        
                        {/* Custom metadata rendering */}
                        {event.metadata?.score && (
                          <div className="text-xs text-[#6F7068] mt-1 flex items-center gap-2">
                            <span className="font-semibold text-[#315B45]">Score: {event.metadata.score}/10</span>
                            {event.metadata.duration && <span>• {event.metadata.duration} min</span>}
                          </div>
                        )}
                        {event.metadata?.topics?.length > 0 && (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {event.metadata.topics.map((t, i) => (
                              <Badge key={i} variant="neutral" size="sm">{t}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Recent Activity grouped by day */}
          <div className="space-y-4">
            <h3 className="text-[0.7rem] font-bold tracking-widest uppercase text-[#92928A]">Recent Activity</h3>
            {recentGroupKeys.length === 0 ? (
              <p className="text-sm text-[#6F7068]">No recent activity found for this platform.</p>
            ) : (
              recentGroupKeys.map(dateKey => {
                const dateObj = parseISO(dateKey);
                const isToday = isSameDay(dateObj, new Date());
                const isYesterday = isSameDay(dateObj, new Date(Date.now() - 86400000));
                
                let label = format(dateObj, 'MMM d, yyyy');
                if (isToday) label = 'TODAY';
                else if (isYesterday) label = 'YESTERDAY';

                return (
                  <div key={dateKey} className="space-y-3">
                    <h4 className="text-xs font-bold text-[#6F7068] uppercase tracking-wider">{label}</h4>
                    <Card className="divide-y divide-[#F0ECE4] border-[#E5E0D6] bg-[#FFFDF8]">
                      {recentGroups[dateKey].map(event => (
                        <div key={event.id} className="p-4 flex items-center justify-between">
                          <div>
                            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#C9683A]">
                              {event.platform}
                            </span>
                            <p className="text-sm font-bold text-[#20211E] mt-0.5">{event.metadata?.title}</p>
                            {event.metadata?.score && <p className="text-xs text-[#6F7068] mt-0.5">Score: {event.metadata.score}</p>}
                          </div>
                        </div>
                      ))}
                    </Card>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 border-[#E5E0D6] bg-[#FFFDF8] space-y-6">
            <div>
              <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-[#92928A] mb-4">Activity Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-black text-[#20211E] font-mono">{stats.totalActivities}</p>
                  <p className="text-xs text-[#6F7068] font-semibold mt-1">Total Activities</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#20211E] font-mono">{stats.activeDays}</p>
                  <p className="text-xs text-[#6F7068] font-semibold mt-1">Active Days</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#C9683A] font-mono">{stats.currentStreak}</p>
                  <p className="text-xs text-[#6F7068] font-semibold mt-1">Current Streak</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#315B45] font-mono">{stats.longestStreak}</p>
                  <p className="text-xs text-[#6F7068] font-semibold mt-1">Longest Streak</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#F0ECE4]">
              <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-[#92928A] mb-4">Platform Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#6F7068] flex items-center gap-2"><Target className="w-4 h-4"/> Careerly</span>
                  <span className="font-bold text-[#20211E]">{stats.platformBreakdown.careerly}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#6F7068] flex items-center gap-2"><Code2 className="w-4 h-4"/> LeetCode</span>
                  <span className="font-bold text-[#20211E]">{stats.platformBreakdown.leetcode}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#6F7068] flex items-center gap-2"><GitCommit className="w-4 h-4"/> GitHub</span>
                  <span className="font-bold text-[#20211E]">{stats.platformBreakdown.github}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#6F7068] flex items-center gap-2"><Briefcase className="w-4 h-4"/> Applications</span>
                  <span className="font-bold text-[#20211E]">{stats.platformBreakdown.applications}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-[#F0ECE4]">
               <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-[#92928A] mb-3">Activity Insights</h3>
               <p className="text-sm text-[#20211E] leading-relaxed font-medium bg-[#F8F6F0] p-4 rounded-xl border border-[#E5E0D6]">
                 {stats.insightsStr}
               </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
