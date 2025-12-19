
import React from 'react';
import { Journey, UserStats } from '../types';

interface DashboardProps {
  journeys: Journey[];
  onSelectJourney: (id: string) => void;
  onCreateNew: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ journeys, onSelectJourney, onCreateNew }) => {
  const stats: UserStats = {
    completedJourneys: journeys.filter(j => j.progress === 100).length,
    activeJourneys: journeys.filter(j => j.progress < 100).length,
    totalStepsCompleted: journeys.reduce((acc, j) => 
      acc + j.milestones.reduce((mAcc, m) => mAcc + m.steps.filter(s => s.completed).length, 0), 0
    )
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Welcome & Stats */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Hello, Achiever</h1>
          <p className="text-slate-500 mt-2">Ready to take another step towards your goals?</p>
        </div>
        <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
          {[
            { label: 'Active', val: stats.activeJourneys, color: 'text-indigo-600' },
            { label: 'Done', val: stats.completedJourneys, color: 'text-emerald-600' },
            { label: 'Steps', val: stats.totalStepsCompleted, color: 'text-amber-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 min-w-[100px] text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Journey List */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">My Journeys</h2>
          <button 
            onClick={onCreateNew}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <span className="text-xl leading-none">+</span> New Journey
          </button>
        </div>

        {journeys.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">No journeys yet</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">Create your first AI-powered roadmap to start tracking your progress and achieving your dreams.</p>
            <button 
              onClick={onCreateNew}
              className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
            >
              Start First Journey
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journeys.map((journey) => (
              <div 
                key={journey.id}
                onClick={() => onSelectJourney(journey.id)}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-widest">
                    {journey.category}
                  </span>
                  {journey.progress === 100 && (
                    <span className="text-emerald-500">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-1">{journey.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 h-10 mb-6">{journey.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-400">Progress</span>
                    <span className="font-bold text-slate-700">{journey.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${journey.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                   <span>{journey.milestones.length} Milestones</span>
                   <span className="group-hover:text-indigo-600 flex items-center gap-1">
                     Details <span>→</span>
                   </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
