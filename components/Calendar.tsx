import React, { useState } from 'react';
import { Goal } from '../types';

interface CalendarProps {
  goals: Goal[];
  onSelectDate?: (date: Date) => void;
  onGoalClick?: (goal: Goal) => void;
}

const Calendar: React.FC<CalendarProps> = ({ goals, onSelectDate, onGoalClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getGoalsForDate = (date: Date) => {
    return goals.filter(goal => {
      const goalDate = new Date(goal.dateTime);
      return goalDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-semibold text-slate-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="p-2"></div>;
          }

          const dayGoals = getGoalsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = date < new Date() && !isToday;

          return (
            <div
              key={index}
              className={`min-h-[80px] p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${
                isToday ? 'bg-[var(--primary)] bg-opacity-10 border-[var(--primary)]' : ''
              } ${isPast ? 'opacity-50' : ''}`}
              onClick={() => onSelectDate?.(date)}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-[var(--primary)] font-bold' : 'text-slate-700'}`}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayGoals.slice(0, 2).map(goal => (
                  <div
                    key={goal.id}
                    className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${
                      goal.completed ? 'bg-green-100 text-green-700' : 'bg-[var(--primary)] bg-opacity-20 text-[var(--primary-text)]'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onGoalClick?.(goal);
                    }}
                    title={goal.title}
                  >
                    {goal.title}
                  </div>
                ))}
                {dayGoals.length > 2 && (
                  <div className="text-xs text-slate-500">
                    +{dayGoals.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[var(--primary)] bg-opacity-20 rounded"></div>
          <span className="text-slate-600">Upcoming Goals</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 rounded"></div>
          <span className="text-slate-600">Completed Goals</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;