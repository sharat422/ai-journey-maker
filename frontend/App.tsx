import React, { useState, useEffect, useRef } from 'react';
import { Journey, AppTheme, User, Blog, Goal } from './types';
import Dashboard from './components/Dashboard';
import JourneyBuilder from './components/JourneyBuilder';
import JourneyDetail from './components/JourneyDetail';
import LegalView from './components/LegalView';
import SubscriptionModal from './components/SubscriptionModal';
import AuthView from './components/AuthView';
import SettingsView from './components/SettingsView';
import BlogList from './components/BlogList';
import BlogDetail from './components/BlogDetail';
import BlogEditor from './components/BlogEditor';
import GoalsView from './components/GoalsView';
import GoalEditor from './components/GoalEditor';
import { db } from './services/dbService';
import { auth } from './services/authService';

import { StreakService } from './services/StreakService';
import MonetizationModal from './components/MonetizationModal';
import GrowthSharingModal from './components/GrowthSharingModal';

// Admin email for blog management
const ADMIN_EMAIL = 'sharatreddy46@gmail.com';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(auth.getCurrentUser());
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [view, setView] = useState<'dashboard' | 'create' | 'detail' | 'privacy' | 'terms' | 'settings' | 'blog-list' | 'blog-detail' | 'blog-editor' | 'goals' | 'goal-editor' | 'auth'>('dashboard');
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);

  // Blog State
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isSavingBlog, setIsSavingBlog] = useState(false);

  // Goals State
  const [goals, setGoals] = useState<Goal[]>([]);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [initialGoalDate, setInitialGoalDate] = useState<Date | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [theme, setTheme] = useState<AppTheme>((localStorage.getItem('stride_theme') as AppTheme) || 'default');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Monetization State
  const [streak, setStreak] = useState(0);
  const [monetizationModal, setMonetizationModal] = useState<{ isOpen: boolean, mode: 'value_unlock' | 'limit_reached' | 'premium_upgrade', msg?: string }>({
    isOpen: false, mode: 'value_unlock'
  });
  const [growthModal, setGrowthModal] = useState<{ isOpen: boolean, journey: Journey | null }>({ isOpen: false, journey: null });

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

  // Streak Check & Monetization Trigger
  useEffect(() => {
    if (user) {
      StreakService.checkStreak(user.id).then(data => {
        if (data.status === 'success') {
          setStreak(data.current_streak);
          // Trigger Reward on Day 3 and 5
          if (data.current_streak === 3 || data.current_streak === 5) {
            setMonetizationModal({
              isOpen: true,
              mode: 'value_unlock',
            });
          }
        }
      });
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
    try {
      await auth.signOut();
      // Force reset local state to ensure the UI updates
      setUser(null);
      setJourneys([]);
      setView('dashboard');
    } catch (error) {
      console.error("Logout error (non-fatal):", error);
    } finally {
      // Always reset local state
      setUser(null);
      setJourneys([]);
      setView('dashboard');
    }

  };

  const handleCreateJourney = async (newJourney: Journey) => {
    if (!user || !user.id) {
      console.error("No authenticated user found.");
      alert("You must be logged in to save a journey.");
      throw new Error("User not authenticated");
    }

    // Ensure the journey object has the correct user_id from the current session
    // const journeyWithUser: Journey = { 
    //   ...newJourney, 
    //   userId: user.id 
    // };

    const journeyWithUser: Journey = {
      ...newJourney,
      id: newJourney.id || crypto.randomUUID(),
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

  // Blog Handlers
  const isAdmin = user?.email === ADMIN_EMAIL;

  const loadBlogs = async () => {
    try {
      const fetchedBlogs = await db.getBlogs();
      setBlogs(fetchedBlogs);
    } catch (err) {
      console.error('Failed to load blogs:', err);
    }
  };

  const handleSaveBlog = async (data: { title: string; content: string }) => {
    if (!user || !isAdmin) return;
    setIsSavingBlog(true);
    try {
      const savedBlog = await db.saveBlog({
        ...editingBlog,
        title: data.title,
        content: data.content,
        authorId: user.id,
        authorEmail: user.email,
        authorName: user.name
      });

      if (editingBlog) {
        setBlogs(blogs.map(b => b.id === savedBlog.id ? savedBlog : b));
      } else {
        setBlogs([savedBlog, ...blogs]);
      }

      setEditingBlog(null);
      setSelectedBlogId(savedBlog.id);
      setView('blog-detail');
    } catch (err) {
      console.error('Failed to save blog:', err);
      alert('Could not save the blog post. Please try again.');
    } finally {
      setIsSavingBlog(false);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!isAdmin) return;
    try {
      await db.deleteBlog(id);
      setBlogs(blogs.filter(b => b.id !== id));
      setSelectedBlogId(null);
      setView('blog-list');
    } catch (err) {
      console.error('Failed to delete blog:', err);
      alert('Could not delete the blog post. Please try again.');
    }
  };

  // Goal Handlers
  const handleCreateGoal = async (data: { title: string; description: string; dateTime: string }) => {
    if (!user) return;
    setIsSavingGoal(true);
    try {
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        userId: user.id,
        title: data.title,
        description: data.description,
        dateTime: data.dateTime,
        completed: false,
        createdAt: new Date().toISOString()
      };
      await db.saveGoal(newGoal);
      setGoals(prev => [...prev, newGoal]);
    } catch (err) {
      console.error('Failed to create goal:', err);
      alert('Could not create the goal. Please try again.');
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleUpdateGoal = async (updatedGoal: Goal) => {
    setIsSavingGoal(true);
    try {
      await db.saveGoal(updatedGoal);
      setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    } catch (err) {
      console.error('Failed to update goal:', err);
      alert('Could not update the goal. Please try again.');
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await db.deleteGoal(id);
      setGoals(goals.filter(g => g.id !== id));
    } catch (err) {
      console.error('Failed to delete goal:', err);
      alert('Could not delete the goal. Please try again.');
    }
  };

  // Load blogs when switching to blog views
  useEffect(() => {
    if (view === 'blog-list' && blogs.length === 0) {
      loadBlogs();
    }
  }, [view]);

  // Load goals when user is authenticated
  useEffect(() => {
    if (user) {
      loadGoals();
    } else {
      setGoals([]);
    }
  }, [user]);

  const loadGoals = async () => {
    try {
      const fetchedGoals = await db.getUserGoals(user!.id);
      setGoals(fetchedGoals);
    } catch (err) {
      console.error('Failed to load goals:', err);
    }
  };

  if (!isInitialized) return null;

  const currentJourney = journeys.find(j => j.id === selectedJourneyId);
  const currentBlog = blogs.find(b => b.id === selectedBlogId);
  const themes: { id: AppTheme, color: string }[] = [
    { id: 'default', color: 'bg-[#4f46e5]' },
    { id: 'emerald', color: 'bg-[#059669]' },
    { id: 'rose', color: 'bg-[#e11d48]' },
    { id: 'amber', color: 'bg-[#d97706]' },
    { id: 'slate', color: 'bg-[#334155]' },
  ];

  // Logic for Trial Expiration
  const TRIAL_DAYS = 7;
  // Fallback to now if createdAt is missing, to avoid instant lockout on old schema users
  const createdAtTime = user ? new Date(user.createdAt || new Date().toISOString()).getTime() : Date.now();
  const daysSinceSignup = (Date.now() - createdAtTime) / (1000 * 60 * 60 * 24);
  const isTrialExpired = daysSinceSignup >= TRIAL_DAYS;
  const trialDaysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - daysSinceSignup));
  const isRestricted = !user?.isPro && isTrialExpired;

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
            <span className="text-xl font-bold text-slate-800">PrimePro <span className="text-[var(--primary-text)]">AI</span></span>
            {user?.isPro && <span className="bg-amber-100 text-amber-700 text-[8px] px-1.5 py-0.5 rounded font-black ml-1">Pro</span>}
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

            {user ? (
              <button onClick={() => setView('settings')} className="relative group">
                {user.avatar ? (
                  <img src={user.avatar} className="w-8 h-8 rounded-full border border-slate-200" alt="Profile" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400">
                    {user.name?.charAt(0) || user.email.charAt(0)}
                  </div>
                )}
              </button>
            ) : (
              <button onClick={() => setView('auth')} className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all">
                Sign In
              </button>
            )}

            {user && !user.isPro && (
              <button onClick={() => setIsSubscriptionModalOpen(true)} className="text-sm font-bold text-[var(--primary-text)] hidden sm:block">Go Pro</button>
            )}
            <button onClick={() => setView('dashboard')} className={`text-sm font-semibold ${view === 'dashboard' ? 'text-[var(--primary-text)] font-bold' : 'text-slate-500'}`}>Home</button>
            <button
              onClick={() => setView('blog-list')}
              className={`text-sm font-semibold ${view === 'blog-list' || view === 'blog-detail' || view === 'blog-editor' ? 'text-[var(--primary-text)] font-bold' : 'text-slate-500'}`}
            >
              Blog
            </button>
            <button
              onClick={() => setView('goals')}
              className={`text-sm font-semibold ${view === 'goals' ? 'text-[var(--primary-text)] font-bold' : 'text-slate-500'}`}
            >
              Goals
            </button>
            <button
              onClick={() => {
                if (!user) {
                  setView('auth');
                } else if (isRestricted) {
                  setIsSubscriptionModalOpen(true);
                } else {
                  setView('create');
                }
              }}
              className={`px-4 py-2 text-white text-sm font-bold rounded-lg transition-all ${!user || isRestricted ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 active:scale-95'}`}
            >
              New Stride
            </button>
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
                isPro={user?.isPro || false}
                userName={user ? (user.name || user.email.split('@')[0]) : 'Guest'}
                onUpgrade={() => setIsSubscriptionModalOpen(true)}
                onSelectJourney={(id) => {
                  if (isRestricted) {
                    // Optionally block viewing existing journeys too, but usually SaaS block CREATION heavily.
                    // I will BLOCK accessing details for now as per "continue" requirement.
                    setIsSubscriptionModalOpen(true);
                  } else {
                    setSelectedJourneyId(id);
                    setView('detail');
                  }
                }}
                onCreateNew={() => {
                  if (!user) {
                    setView('auth');
                    return;
                  }
                  const activeCount = journeys.filter(j => j.progress < 100).length;
                  if (!user?.isPro && activeCount >= 2) {
                    setMonetizationModal({
                      isOpen: true,
                      mode: 'limit_reached',
                    });
                    return;
                  }

                  if (isRestricted) {
                    setIsSubscriptionModalOpen(true);
                  } else {
                    setView('create');
                  }
                }}
                isTrialExpired={isTrialExpired}
                trialDaysLeft={trialDaysLeft}
                streak={streak}
                onShare={(journeyId) => {
                  const j = journeys.find(jp => jp.id === journeyId);
                  if (j) setGrowthModal({ isOpen: true, journey: j });
                }}
              />
            )}
            {(view === 'privacy' || view === 'terms') && <LegalView type={view} onBack={() => setView('dashboard')} />}
            {/* Hard Block usage of builders if restricted, even if state was manually set */}
            {view === 'create' && !isRestricted && <JourneyBuilder onJourneyCreated={handleCreateJourney} onCancel={() => setView('dashboard')} isPro={user?.isPro || false} />}
            {view === 'detail' && currentJourney && !isRestricted && <JourneyDetail journey={currentJourney} onUpdateJourney={handleUpdateJourney} onBack={() => setView('dashboard')} />}
            {view === 'settings' && <SettingsView user={user} onBack={() => setView('dashboard')} />}

            {/* Fallback forbidden view if they managed to get here */}
            {(view === 'create' || view === 'detail') && isRestricted && (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="text-4xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Locked</h2>
                <p className="text-slate-500 mb-6">Your trial has expired. Subscribe to continue.</p>
                <button onClick={() => setIsSubscriptionModalOpen(true)} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">Restore Access</button>
              </div>
            )}

            {/* Blog Views */}
            {view === 'blog-list' && (
              <BlogList
                blogs={blogs}
                isAdmin={isAdmin}
                onSelectBlog={(id) => {
                  setSelectedBlogId(id);
                  setView('blog-detail');
                }}
                onCreateNew={() => {
                  setEditingBlog(null);
                  setView('blog-editor');
                }}
                onBack={() => setView('dashboard')}
              />
            )}
            {view === 'blog-detail' && currentBlog && (
              <BlogDetail
                blog={currentBlog}
                isAdmin={isAdmin}
                onEdit={() => {
                  setEditingBlog(currentBlog);
                  setView('blog-editor');
                }}
                onDelete={() => handleDeleteBlog(currentBlog.id)}
                onBack={() => setView('blog-list')}
              />
            )}
            {view === 'blog-editor' && isAdmin && (
              <BlogEditor
                blog={editingBlog}
                onSave={handleSaveBlog}
                onCancel={() => {
                  setEditingBlog(null);
                  setView(selectedBlogId ? 'blog-detail' : 'blog-list');
                }}
                isSaving={isSavingBlog}
              />
            )}

            {/* Goals View */}
            {view === 'goals' && (
              <GoalsView
                goals={goals}
                onCreateNewGoal={(date) => {
                  setEditingGoal(null);
                  setInitialGoalDate(date || null);
                  setView('goal-editor');
                }}
                onEditGoal={(goal) => {
                  setEditingGoal(goal);
                  setView('goal-editor');
                }}
                onDeleteGoal={handleDeleteGoal}
                onBack={() => setView('dashboard')}
                isSaving={isSavingGoal}
              />
            )}

            {/* Goal Editor */}
            {view === 'goal-editor' && (
              <GoalEditor
                goal={editingGoal}
                initialDate={initialGoalDate}
                onSave={(data) => {
                  if (editingGoal) {
                    handleUpdateGoal({
                      ...editingGoal,
                      title: data.title,
                      description: data.description,
                      dateTime: data.dateTime
                    });
                  } else {
                    handleCreateGoal(data);
                  }
                  setView('goals');
                  setEditingGoal(null);
                  setInitialGoalDate(null);
                }}
                onCancel={() => {
                  setEditingGoal(null);
                  setView('goals');
                  setInitialGoalDate(null);
                }}
                isSaving={isSavingGoal}
              />
            )}

            {/* Auth View */}
            {view === 'auth' && (
              <AuthView onLogin={(u) => {
                setUser(u);
                setView('dashboard');
              }} />
            )}
          </>
        )}
      </main>

      <SubscriptionModal isOpen={isSubscriptionModalOpen} onClose={() => setIsSubscriptionModalOpen(false)} onSuccess={handleUpgradeSuccess} />

      <MonetizationModal
        isOpen={monetizationModal.isOpen}
        onClose={() => setMonetizationModal(prev => ({ ...prev, isOpen: false }))}
        mode={monetizationModal.mode}
        streakDays={streak}
        onActionComplete={(action) => {
          console.log("Monetization Action:", action);
          if (action === 'sub_monthly' || action === 'sub_yearly') {
            setMonetizationModal(prev => ({ ...prev, isOpen: false }));
            setIsSubscriptionModalOpen(true);
          } else if (action === 'unlock_insight') {
            // Free value unlock - just close the modal
            setMonetizationModal(prev => ({ ...prev, isOpen: false }));
            // Optionally show a toast or navigate to insights
            alert("🎉 Today's insight unlocked! Keep up the great work!");
          } else if (action === 'save_streak') {
            // User wants to protect their streak - show purchase options
            setMonetizationModal(prev => ({ ...prev, isOpen: true, mode: 'limit_reached' }));
          } else {
            // Handle other actions like 'buy_freeze', 'buy_goal', etc.
            setMonetizationModal(prev => ({ ...prev, isOpen: false }));
          }
        }}
      />

      {growthModal.journey && user && (
        <GrowthSharingModal
          isOpen={growthModal.isOpen}
          onClose={() => setGrowthModal({ ...growthModal, isOpen: false })}
          journey={growthModal.journey}
          user={user}
          streak={streak}
        />
      )}

      <footer className="mt-20 border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 text-xs font-medium tracking-tight">&copy; 2026 Prime Pro AI. All Rights Reserved.</p>
          <div className="flex gap-8">
            {user && <button onClick={handleLogout} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sign Out</button>}
            <button onClick={() => setView('privacy')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Privacy</button>
            <button onClick={() => setView('terms')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
