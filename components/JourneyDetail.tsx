
import React from 'react';
import { Journey, Milestone, Step } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface JourneyDetailProps {
  journey: Journey;
  onUpdateJourney: (updated: Journey) => void;
  onBack: () => void;
}

const JourneyDetail: React.FC<JourneyDetailProps> = ({ journey, onUpdateJourney, onBack }) => {
  const toggleStep = (milestoneId: string, stepId: string) => {
    const updatedMilestones = journey.milestones.map(m => {
      if (m.id !== milestoneId) return m;
      return {
        ...m,
        steps: m.steps.map(s => (s.id === stepId ? { ...s, completed: !s.completed } : s))
      };
    });

    const totalSteps = updatedMilestones.reduce((acc, m) => acc + m.steps.length, 0);
    const completedSteps = updatedMilestones.reduce((acc, m) => acc + m.steps.filter(s => s.completed).length, 0);
    const progress = Math.round((completedSteps / totalSteps) * 100);

    onUpdateJourney({
      ...journey,
      milestones: updatedMilestones,
      progress
    });
  };

  // Mock data for chart - showing progress over 7 "days"
  const chartData = [
    { name: 'Day 1', progress: 0 },
    { name: 'Day 2', progress: Math.min(journey.progress, 5) },
    { name: 'Day 3', progress: Math.min(journey.progress, 15) },
    { name: 'Day 4', progress: Math.min(journey.progress, 30) },
    { name: 'Day 5', progress: Math.min(journey.progress, 50) },
    { name: 'Day 6', progress: Math.min(journey.progress, 80) },
    { name: 'Today', progress: journey.progress },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={onBack}
            className="text-indigo-600 hover:text-indigo-700 font-medium mb-4 flex items-center gap-1 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-slate-900">{journey.title}</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">{journey.description}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-slate-100"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={175.92}
                strokeDashoffset={175.92 - (175.92 * journey.progress) / 100}
                className="text-indigo-600 transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
              {journey.progress}%
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Current Progress</div>
            <div className="text-xs text-slate-400">Keep going, you're doing great!</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Milestones */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-800">Your Roadmap</h2>
          {journey.milestones.map((milestone, idx) => (
            <div key={milestone.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{milestone.title}</h3>
                    <p className="text-xs text-slate-500">Estimated: {milestone.estimatedDays} days</p>
                  </div>
                </div>
                {milestone.steps.every(s => s.completed) && (
                  <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full uppercase tracking-wider">
                    Completed
                  </span>
                )}
              </div>
              <div className="p-5 space-y-4">
                <p className="text-slate-600 text-sm italic mb-4">"{milestone.description}"</p>
                <div className="space-y-3">
                  {milestone.steps.map((step) => (
                    <label 
                      key={step.id} 
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${
                        step.completed 
                          ? 'bg-green-50/50 border-green-100 text-slate-400' 
                          : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={step.completed}
                        onChange={() => toggleStep(milestone.id, step.id)}
                        className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className={`text-sm font-medium ${step.completed ? 'line-through' : 'text-slate-700'}`}>
                        {step.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Analytics & Motivation */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Growth Velocity</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="progress" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorProg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-indigo-50 rounded-xl">
              <p className="text-xs text-indigo-700 leading-relaxed">
                <strong>Insight:</strong> You're showing consistent progress! Your most active milestone was Phase 1. Complete 2 more steps to hit your weekly goal.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2">AI Motivator</h3>
            <p className="text-slate-300 text-sm italic">
              "Every master was once a beginner. The journey of {journey.title} is not about perfection, but about showing up. You've completed {journey.milestones.reduce((a, m) => a + m.steps.filter(s => s.completed).length, 0)} steps so far. That's more than yesterday!"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyDetail;
