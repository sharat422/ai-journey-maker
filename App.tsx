
import React, { useState, useEffect } from 'react';
import { Journey } from './types';
import Dashboard from './components/Dashboard';
import JourneyBuilder from './components/JourneyBuilder';
import JourneyDetail from './components/JourneyDetail';

const App: React.FC = () => {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [view, setView] = useState<'dashboard' | 'create' | 'detail'>('dashboard');
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);

  // Persistence (local storage)
  useEffect(() => {
    const saved = localStorage.getItem('progresslens_journeys');
    if (saved) {
      setJourneys(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('progresslens_journeys', JSON.stringify(journeys));
  }, [journeys]);

  const handleCreateJourney = (newJourney: Journey) => {
    setJourneys([newJourney, ...journeys]);
    setSelectedJourneyId(newJourney.id);
    setView('detail');
  };

  const handleUpdateJourney = (updated: Journey) => {
    setJourneys(journeys.map(j => j.id === updated.id ? updated : j));
  };

  const currentJourney = journeys.find(j => j.id === selectedJourneyId);

  return (
    <div className="min-h-screen pb-12">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-morphism border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setView('dashboard')}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              Progress<span className="text-indigo-600">Lens</span>
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setView('dashboard')}
              className={`text-sm font-semibold transition-colors ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setView('create')}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all shadow-sm"
            >
              Start New
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pt-10">
        {view === 'dashboard' && (
          <Dashboard 
            journeys={journeys} 
            onSelectJourney={(id) => {
              setSelectedJourneyId(id);
              setView('detail');
            }}
            onCreateNew={() => setView('create')}
          />
        )}

        {view === 'create' && (
          <JourneyBuilder 
            onJourneyCreated={handleCreateJourney}
            onCancel={() => setView('dashboard')}
          />
        )}

        {view === 'detail' && currentJourney && (
          <JourneyDetail 
            journey={currentJourney}
            onUpdateJourney={handleUpdateJourney}
            onBack={() => setView('dashboard')}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="mt-20 border-t border-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-xs font-medium">
            &copy; 2024 ProgressLens AI. Empowering growth through intelligent roadmaps.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
