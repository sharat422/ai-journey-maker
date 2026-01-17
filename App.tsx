
import React, { useState, useEffect, useRef } from 'react';
import { Journey, AppTheme, User } from './types';
import Dashboard from './components/Dashboard';
import JourneyBuilder from './components/JourneyBuilder';
import JourneyDetail from './components/JourneyDetail';
import LegalView from './components/LegalView';
import SubscriptionModal from './components/SubscriptionModal';
import AuthView from './components/AuthView';
import SettingsView from './components/SettingsView';
import { db } from './services/dbService';
import { auth } from './services/authService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(auth.getCurrentUser());
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [view, setView] = useState<'dashboard' | 'create' | 'detail' | 'privacy' | 'terms' | 'settings'>('dashboard');
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [theme, setTheme] = useState<AppTheme>((localStorage.getItem('stride_theme') as AppTheme) || 'default');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const firedReminders = useRef<Set<string>>(new Set());

  // Listen for Auth changes (Real-time updates)
  useEffect(() => {
    const unsubscribe = auth.subscribe((u) => {
      setUser(u);
      setIsInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync Journeys with DB when user is authenticated
  useEffect(() => {
    if (!user) {
      setJourneys([]);
      return;
    }

    const syncData = async () => {
      setIsLoadingData(true);
      try {
        const userJourneys = await db.getUserJourneys(user.id);
        console.log("Journeys fetched for user:", user.id, userJourneys); // Check this log
        setJourneys(userJourneys);
      } catch (err) {
        console.error("Sync failed", err);
      } finally {
        setIsLoadingData(false);
      }
    };

    syncData();
  }, [user]);


  // Add this inside the App component
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');

  if (sessionId && user) {
    const finalizeUpgrade = async () => {
      // 1. Update the database via your dbService
      await db.setProStatus(user.id, true);
      
      // 2. Update the local auth state
      auth.updateUser({ ...user, isPro: true });
      
      // 3. Remove session_id from URL for a clean UI
      window.history.replaceState({}, document.title, "/");
    };
    
    finalizeUpgrade();
  }
}, [user]);
  // Notifications logic remains robust
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const now = Date.now();
      journeys.forEach(journey => {
        journey.milestones.forEach(milestone => {
          milestone.steps.forEach(step => {
            if (step.reminderAt && step.reminderAt <= now && !step.completed && !firedReminders.current.has(step.id)) {
              firedReminders.current.add(step.id);
              triggerReminder(journey.title, step.title);
            }
          });
        });
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [journeys, user]);

  const triggerReminder = (journeyTitle: string, stepTitle: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Stride Reminder', {
        body: `Next: ${stepTitle}\nJourney: ${journeyTitle}`,
        icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
      });
    }
  };

  const handleLogout = async () => {
    try{
      await auth.signOut();
      // Force reset local state to ensure the UI updates
      setUser(null);
      setJourneys([]);
      setView('dashboard');
    } catch (error){
      console.error("Logout failed:", error);
    }
    
  };

  const handleCreateJourney = async (newJourney: Journey) => {
    if (!user || !user.id) {console.error("No authenticated user found."); return;} 

// Ensure the journey object has the correct user_id from the current session
 // const journeyWithUser: Journey = { 
 //   ...newJourney, 
 //   userId: user.id 
 // };
   
   const journeyWithUser: Journey = { 
    ...newJourney, 
    id: newJourney.id || `j-${Date.now()}`,
    userId: user.id,
    createdAt: newJourney.createdAt || Date.now()
   };
try {
    // 1. Save to database FIRST to ensure persistence
    await db.saveJourney(journeyWithUser);
    
    // 2. Update local state ONLY after successful DB save
    setJourneys(prev => [journeyWithUser, ...prev]);
    setSelectedJourneyId(journeyWithUser.id);
    setView('detail');
  } catch (err) {
    console.error("Failed to save journey to Supabase:", err);
    alert("Could not save your journey. Please check your connection.");
  }
  };

  const handleUpdateJourney = async (updated: Journey) => {
    setJourneys(journeys.map(j => j.id === updated.id ? updated : j));
    await db.saveJourney(updated);
  };

  const handleUpgradeSuccess = async () => {
    if (!user) return;
    const updatedUser = { ...user, isPro: true };
    auth.updateUser(updatedUser);
    await db.setProStatus(user.id, true);
  };

  if (!isInitialized) return null;

  if (!user) {
    return <AuthView onLogin={(u) => setUser(u)} />;
  }

  const currentJourney = journeys.find(j => j.id === selectedJourneyId);
  const themes: { id: AppTheme, color: string }[] = [
    { id: 'default', color: 'bg-[#4f46e5]' },
    { id: 'emerald', color: 'bg-[#059669]' },
    { id: 'rose', color: 'bg-[#e11d48]' },
    { id: 'amber', color: 'bg-[#d97706]' },
    { id: 'slate', color: 'bg-[#334155]' },
  ];

  return (
    <div className={`min-h-screen pb-12 flex flex-col transition-colors duration-300 ${theme === 'default' ? '' : `theme-${theme}`}`}>
      <nav className="sticky top-0 z-50 glass-morphism border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('dashboard')}>
            <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-800">Stride <span className="text-[var(--primary-text)]">AI</span></span>
            {user.isPro && <span className="bg-amber-100 text-amber-700 text-[8px] px-1.5 py-0.5 rounded font-black ml-1">Pro</span>}
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 p-1 rounded-full border border-slate-200">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    localStorage.setItem('stride_theme', t.id);
                  }}
                  className={`w-5 h-5 rounded-full ${t.color} border-2 ${theme === t.id ? 'border-white scale-110 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
                />
              ))}
            </div>

            <button onClick={() => setView('settings')} className="relative group">
               {user.avatar ? (
                 <img src={user.avatar} className="w-8 h-8 rounded-full border border-slate-200" alt="Profile" />
               ) : (
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400">
                   {user.name?.charAt(0) || user.email.charAt(0)}
                 </div>
               )}
            </button>

            {!user.isPro && (
              <button onClick={() => setIsSubscriptionModalOpen(true)} className="text-sm font-bold text-[var(--primary-text)] hidden sm:block">Go Pro</button>
            )}
            <button onClick={() => setView('dashboard')} className={`text-sm font-semibold ${view === 'dashboard' ? 'text-[var(--primary-text)] font-bold' : 'text-slate-500'}`}>Home</button>
            <button onClick={() => setView('create')} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 active:scale-95 transition-all">New Stride</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 pt-10 flex-grow w-full">
        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <div className="w-8 h-8 border-2 border-slate-200 border-t-[var(--primary)] rounded-full animate-spin mb-4"></div>
             <p className="text-sm font-medium">Loading secure stride session...</p>
          </div>
        ) : (
          <>
            {view === 'dashboard' && (
              <Dashboard 
                journeys={journeys} 
                isPro={user.isPro}
                userName={user.name || user.email.split('@')[0]}
                onUpgrade={() => setIsSubscriptionModalOpen(true)}
                onSelectJourney={(id) => { setSelectedJourneyId(id); setView('detail'); }}
                onCreateNew={() => setView('create')}
              />
            )}
            {view === 'create' && <JourneyBuilder onJourneyCreated={handleCreateJourney} onCancel={() => setView('dashboard')} isPro={user.isPro} />}
            {view === 'detail' && currentJourney && <JourneyDetail journey={currentJourney} onUpdateJourney={handleUpdateJourney} onBack={() => setView('dashboard')} />}
            {(view === 'privacy' || view === 'terms') && <LegalView type={view} onBack={() => setView('dashboard')} />}
            {view === 'settings' && <SettingsView user={user} onBack={() => setView('dashboard')} />}
          </>
        )}
      </main>

      <SubscriptionModal isOpen={isSubscriptionModalOpen} onClose={() => setIsSubscriptionModalOpen(false)} onSuccess={handleUpgradeSuccess} />

      <footer className="mt-20 border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 text-xs font-medium tracking-tight">&copy; 2024 Stride AI. All Rights Reserved.</p>
          <div className="flex gap-8">
            <button onClick={handleLogout} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sign Out</button>
            <button onClick={() => setView('privacy')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Privacy</button>
            <button onClick={() => setView('terms')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
