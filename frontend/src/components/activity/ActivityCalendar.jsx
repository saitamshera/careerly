import React from 'react';
import { 
  subYears, 
  eachDayOfInterval, 
  format, 
  startOfWeek, 
  endOfWeek, 
  isSameDay, 
  parseISO 
} from 'date-fns';

export function ActivityCalendar({ events, onDayClick, selectedDate }) {
  const today = new Date();
  const oneYearAgo = subYears(today, 1);
  
  const startDate = startOfWeek(oneYearAgo);
  const endDate = endOfWeek(today);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayIntensity = (date) => {
    const dayEvents = events.filter(e => isSameDay(parseISO(e.timestamp), date));
    const count = dayEvents.reduce((acc, curr) => acc + (curr.metadata?.count || 1), 0);
    
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 10) return 3;
    return 4;
  };

  const getIntensityClass = (intensity) => {
    switch(intensity) {
      case 1: return 'bg-[#D1E0D7] border-[#B6CDA9] hover:bg-[#B6CDA9]';
      case 2: return 'bg-[#9DBEAB] border-[#7CA38C] hover:bg-[#7CA38C]';
      case 3: return 'bg-[#6A997D] border-[#315B45] hover:bg-[#315B45]';
      case 4: return 'bg-[#315B45] border-[#20211E] hover:bg-[#20211E]';
      default: return 'bg-[#F0ECE4] border-[#E5E0D6] hover:bg-[#D1E0D7]';
    }
  };

  const weeks = [];
  let currentWeek = [];

  days.forEach((day, i) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[800px] flex gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => {
              const intensity = getDayIntensity(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const dayEvents = events.filter(e => isSameDay(parseISO(e.timestamp), day));
              const activityCount = dayEvents.reduce((acc, curr) => acc + (curr.metadata?.count || 1), 0);

              return (
                <button
                  key={dayIndex}
                  onClick={() => onDayClick(day, dayEvents)}
                  aria-label={`${format(day, 'MMM d, yyyy')}: ${activityCount} verified activities`}
                  title={`${format(day, 'MMM d, yyyy')}: ${activityCount} verified activities`}
                  className={`w-3 h-3 rounded-xs border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#315B45] ${getIntensityClass(intensity)} ${isSelected ? 'ring-2 ring-offset-1 ring-[#315B45]' : ''}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex items-center justify-end gap-2 text-[0.65rem] text-[#6F7068] uppercase font-bold tracking-wider">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div key={level} className={`w-3 h-3 rounded-xs border ${getIntensityClass(level)}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
