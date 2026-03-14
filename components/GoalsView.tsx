import React from 'react';
import { Goal } from '../types';
import Calendar from './Calendar';

interface GoalsViewProps {
  goals: Goal[];
  onCreateNewGoal: (date?: Date) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onBack: () => void;
  isSaving?: boolean;
}

const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onCreateNewGoal,
  onEditGoal,
  onDeleteGoal,
  onBack,
  isSaving = false
}) => {
  const upcomingGoals = goals.filter(goal => !goal.completed && new Date(goal.dateTime) >= new Date());
  const completedGoals = goals.filter(goal => goal.completed);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Goals</h1>
          <p className="text-slate-500 mt-1">Plan and track your goals with date and time</p>
        </div>
        <button
          onClick={() => onCreateNewGoal()}
          className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-[var(--primary-shadow)] flex items-center gap-2"
        >
          <span className="text-xl leading-none">+</span> New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Calendar
            goals={goals}
            onSelectDate={(date) => onCreateNewGoal(date)}
            onGoalClick={onEditGoal}
          />
        </div>

        {/* Goals Summary */}
        <div className="space-y-6">
          {/* Upcoming Goals */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Upcoming Goals</h3>
            {upcomingGoals.length === 0 ? (
              <p className="text-slate-500 text-sm">No upcoming goals</p>
            ) : (
              <div className="space-y-3">
                {upcomingGoals.slice(0, 5).map(goal => (
                  <div
                    key={goal.id}
                    onClick={() => onEditGoal(goal)}
                    className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <h4 className="font-semibold text-slate-800 text-sm mb-1">{goal.title}</h4>
                    <p className="text-xs text-slate-500">
                      {new Date(goal.dateTime).toLocaleDateString()} at {new Date(goal.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                ))}
                {upcomingGoals.length > 5 && (
                  <p className="text-slate-500 text-sm">+{upcomingGoals.length - 5} more</p>
                )}
              </div>
            )}
          </div>

          {/* Completed Goals */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Completed Goals</h3>
            {completedGoals.length === 0 ? (
              <p className="text-slate-500 text-sm">No completed goals yet</p>
            ) : (
              <div className="space-y-3">
                {completedGoals.slice(0, 5).map(goal => (
                  <div
                    key={goal.id}
                    onClick={() => onEditGoal(goal)}
                    className="p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                  >
                    <h4 className="font-semibold text-green-800 text-sm mb-1 line-through">{goal.title}</h4>
                    <p className="text-xs text-green-600">
                      Completed on {new Date(goal.dateTime).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {completedGoals.length > 5 && (
                  <p className="text-slate-500 text-sm">+{completedGoals.length - 5} more</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsView;