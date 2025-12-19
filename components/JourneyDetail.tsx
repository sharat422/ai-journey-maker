
import React, { useState, useEffect } from 'react';
import { Journey, Milestone, Step } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyzeJourneyProgress, AIInsight } from '../services/geminiService';
import ExportSocialModal from './ExportSocialModal';

interface JourneyDetailProps {
  journey: Journey;
  onUpdateJourney: (updated: Journey) => void;
  onBack: () => void;
}

const JourneyDetail: React.FC<JourneyDetailProps> = ({ journey, onUpdateJourney, onBack }) => {
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeReminderId, setActiveReminderId] = useState<string | null>(null);
  const [justCompletedStepId, setJustCompletedStepId] = useState<string | null>(null);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [draggedMilestoneIdx, setDraggedMilestoneIdx] = useState<number | null>(null);
  const [draggedStep, setDraggedStep] = useState<{ mIdx: number; sIdx: number } | null>(null);

  const toggleStep = (milestoneId: string, stepId: string) => {
    let newlyCompleted = false;
    const updatedMilestones = journey.milestones.map(m => {
      if (m.id !== milestoneId) return m;
      return {
        ...m,
        steps: m.steps.map(s => {
          if (s.id === stepId) {
            if (!s.completed) newlyCompleted = true;
            return { ...s, completed: !s.completed };
          }
          return s;
        })
      };
    });

    if (newlyCompleted) {
      setJustCompletedStepId(stepId);
      setTimeout(() => setJustCompletedStepId(null), 600);
    }

    updateJourneyWithMilestones(updatedMilestones);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const insights = await analyzeJourneyProgress(journey);
      setAiInsights(insights);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const setReminder = (milestoneId: string, stepId: string, dateTime: string | number) => {
    let timestamp: number | undefined;
    if (typeof dateTime === 'string') {
      timestamp = dateTime ? new Date(dateTime).getTime() : undefined;
    } else {
      timestamp = dateTime;
    }

    const updatedMilestones = journey.milestones.map(m => {
      if (m.id !== milestoneId) return m;
      return {
        ...m,
        steps: m.steps.map(s => (s.id === stepId ? { ...s, reminderAt: timestamp } : s))
      };
    });
    updateJourneyWithMilestones(updatedMilestones);
    setActiveReminderId(null);
  };

  const updateJourneyWithMilestones = (updatedMilestones: Milestone[]) => {
    const totalSteps = updatedMilestones.reduce((acc, m) => acc + m.steps.length, 0);
    const completedSteps = updatedMilestones.reduce((acc, m) => acc + m.steps.filter(s => s.completed).length, 0);
    const progress = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

    onUpdateJourney({
      ...journey,
      milestones: updatedMilestones,
      progress
    });
  };

  const handleMilestoneDragStart = (idx: number) => {
    setDraggedMilestoneIdx(idx);
    setDraggedStep(null);
  };

  const handleMilestoneDrop = (targetIdx: number) => {
    if (draggedMilestoneIdx === null || draggedMilestoneIdx === targetIdx) return;
    
    const updatedMilestones = [...journey.milestones];
    const [movedItem] = updatedMilestones.splice(draggedMilestoneIdx, 1);
    updatedMilestones.splice(targetIdx, 0, movedItem);
    
    updateJourneyWithMilestones(updatedMilestones);
    setDraggedMilestoneIdx(null);
  };

  const handleStepDragStart = (mIdx: number, sIdx: number, e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedStep({ mIdx, sIdx });
    setDraggedMilestoneIdx(null);
  };

  const handleStepDrop = (targetMIdx: number, targetSIdx: number, e: React.DragEvent) => {
    e.stopPropagation();
    if (!draggedStep) return;

    const { mIdx: sourceMIdx, sIdx: sourceSIdx } = draggedStep;
    if (sourceMIdx === targetMIdx && sourceSIdx === targetSIdx) {
      setDraggedStep(null);
      return;
    }

    const updatedMilestones = JSON.parse(JSON.stringify(journey.milestones)) as Milestone[];
    const [movedStep] = updatedMilestones[sourceMIdx].steps.splice(sourceSIdx, 1);
    updatedMilestones[targetMIdx].steps.splice(targetSIdx, 0, movedStep);

    updateJourneyWithMilestones(updatedMilestones);
    setDraggedStep(null);
  };

  const handleMilestoneStepDrop = (targetMIdx: number) => {
    if (!draggedStep || draggedStep.mIdx === targetMIdx) return;
    
    const updatedMilestones = JSON.parse(JSON.stringify(journey.milestones)) as Milestone[];
    const [movedStep] = updatedMilestones[draggedStep.mIdx].steps.splice(draggedStep.sIdx, 1);
    updatedMilestones[targetMIdx].steps.push(movedStep);

    updateJourneyWithMilestones(updatedMilestones);
    setDraggedStep(null);
  };

  const handleShare = async () => {
    const completedSteps = journey.milestones.reduce((acc, m) => acc + m.steps.filter(s => s.completed).length, 0);
    const totalSteps = journey.milestones.reduce((acc, m) => acc + m.steps.length, 0);
    const shareText = `🚀 I'm making progress on my journey: "${journey.title}"!\n\n📈 Progress: ${journey.progress}%\n✅ ${completedSteps}/${totalSteps} steps completed.\n\nCreated with Stride AI.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Stride: ${journey.title}`,
          text: shareText,
          url: window.location.href,
        });
        setShareStatus('success');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setShareStatus('error');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setShareStatus('success');
      } catch (err) {
        setShareStatus('error');
      }
    }
    setTimeout(() => setShareStatus('idle'), 3000);
  };

  const getQuickPresetTime = (days: number, hour: number = 9) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.getTime();
  };

  const chartData = [
    { name: 'Day 1', progress: 0 },
    { name: 'Day 2', progress: Math.min(journey.progress, 5) },
    { name: 'Day 3', progress: Math.min(journey.progress, 15) },
    { name: 'Day 4', progress: Math.min(journey.progress, 30) },
    { name: 'Day 5', progress: Math.min(journey.progress, 50) },
    { name: 'Day 6', progress: Math.min(journey.progress, 80) },
    { name: 'Today', progress: journey.progress },
  ];

  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#4f46e5';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1">
          <button 
            onClick={onBack}
            className="text-[var(--primary-text)] hover:opacity-80 font-medium mb-4 flex items-center gap-1 group transition-all"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
          </button>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-4xl font-bold text-slate-900">{journey.title}</h1>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  shareStatus === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-600'
                    : shareStatus === 'error'
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-[var(--primary)] hover:text-[var(--primary-text)]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {shareStatus === 'success' ? 'Copied!' : shareStatus === 'error' ? 'Failed' : 'Share'}
              </button>

              <button
                onClick={() => setIsSocialModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Export Social Reel
              </button>
            </div>
          </div>
          <p className="text-slate-500 mt-2 max-w-2xl">{journey.description}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={175.92}
                strokeDashoffset={175.92 - (175.92 * journey.progress) / 100}
                className="text-[var(--primary)] transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
              {journey.progress}%
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Current Progress</div>
            <div className="text-xs text-slate-400">Keep up the momentum!</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Roadmap</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Organize your strides</p>
          </div>
          
          {journey.milestones.map((milestone, mIdx) => (
            <div 
              key={milestone.id} 
              className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 ${
                draggedMilestoneIdx === mIdx ? 'opacity-40 border-[var(--primary)] scale-95 shadow-inner' : 'border-slate-100'
              } ${draggedStep && draggedStep.mIdx !== mIdx ? 'border-dashed border-indigo-200 bg-indigo-50/10' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedMilestoneIdx !== null) e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onDragLeave={(e) => {
                if (draggedMilestoneIdx !== null) e.currentTarget.style.borderColor = 'rgb(241 245 249)';
              }}
              onDrop={(e) => {
                if (draggedMilestoneIdx !== null) {
                  handleMilestoneDrop(mIdx);
                } else if (draggedStep) {
                  handleMilestoneStepDrop(mIdx);
                }
              }}
            >
              <div 
                className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 cursor-grab active:cursor-grabbing group"
                draggable
                onDragStart={() => handleMilestoneDragStart(mIdx)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm shadow-sm transition-colors shrink-0">
                    {mIdx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{milestone.title}</h3>
                    <p className="text-xs text-slate-500">Estimated: {milestone.estimatedDays} days</p>
                  </div>
                </div>
                {milestone.steps.every(s => s.completed) && milestone.steps.length > 0 && (
                  <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full uppercase tracking-wider shrink-0">
                    Done
                  </span>
                )}
              </div>

              <div className="p-5 space-y-4">
                <p className="text-slate-600 text-sm italic mb-4">"{milestone.description}"</p>
                <div className="space-y-3">
                  {milestone.steps.map((step, sIdx) => (
                    <div 
                      key={step.id} 
                      className={`space-y-2 transition-all duration-300 ${
                        draggedStep?.mIdx === mIdx && draggedStep?.sIdx === sIdx ? 'opacity-30' : ''
                      }`}
                      draggable={!step.completed}
                      onDragStart={(e) => handleStepDragStart(mIdx, sIdx, e)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedStep) {
                          e.currentTarget.style.borderTop = '2px solid var(--primary)';
                          e.currentTarget.style.paddingTop = '8px';
                        }
                      }}
                      onDragLeave={(e) => {
                        if (draggedStep) {
                          e.currentTarget.style.borderTop = 'none';
                          e.currentTarget.style.paddingTop = '0px';
                        }
                      }}
                      onDrop={(e) => {
                        if (draggedStep) {
                          e.currentTarget.style.borderTop = 'none';
                          e.currentTarget.style.paddingTop = '0px';
                          handleStepDrop(mIdx, sIdx, e);
                        }
                      }}
                    >
                      <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${
                          step.completed 
                            ? 'bg-green-50/50 border-green-100 text-slate-400' 
                            : 'bg-white border-slate-100 hover:border-[var(--primary-shadow)]'
                        } ${!step.completed ? 'cursor-grab active:cursor-grabbing' : ''} ${
                          justCompletedStepId === step.id ? 'animate-step-complete' : ''
                        }`}>
                        
                        {!step.completed && (
                          <div className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8h16M4 16h16" />
                            </svg>
                          </div>
                        )}

                        <input 
                          type="checkbox"
                          checked={step.completed}
                          onChange={() => toggleStep(milestone.id, step.id)}
                          className="w-5 h-5 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer transition-colors"
                        />
                        <div className="flex-1 flex flex-col">
                          <span className={`text-sm font-medium transition-all ${step.completed ? 'line-through' : 'text-slate-700'}`}>
                            {step.title}
                          </span>
                          {step.reminderAt && !step.completed && (
                            <span className="text-[10px] font-bold text-[var(--primary-text)] opacity-70 flex items-center gap-1 mt-0.5 animate-fade-in">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Scheduled: {new Date(step.reminderAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        {!step.completed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveReminderId(activeReminderId === step.id ? null : step.id);
                            }}
                            className={`p-1.5 rounded-lg transition-all ${step.reminderAt ? 'text-[var(--primary-text)] bg-[var(--primary-soft)] ring-1 ring-[var(--primary-shadow)]' : 'text-slate-400 hover:bg-slate-50'}`}
                            title={step.reminderAt ? `Reminder set for ${new Date(step.reminderAt).toLocaleString()}` : "Set reminder"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      {activeReminderId === step.id && (
                        <div className="ml-8 p-5 bg-white rounded-2xl border-2 border-[var(--primary-soft)] shadow-xl animate-fade-in space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Schedule Reminder</span>
                            <button onClick={() => setActiveReminderId(null)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setReminder(milestone.id, step.id, getQuickPresetTime(1, 9))}
                                className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 rounded-xl hover:bg-[var(--primary-soft)] hover:text-[var(--primary-text)] hover:border-[var(--primary-shadow)] transition-all"
                            >
                                ☀️ Tomorrow 9am
                            </button>
                            <button 
                                onClick={() => setReminder(milestone.id, step.id, getQuickPresetTime(3, 10))}
                                className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 rounded-xl hover:bg-[var(--primary-soft)] hover:text-[var(--primary-text)] hover:border-[var(--primary-shadow)] transition-all"
                            >
                                📅 In 3 Days
                            </button>
                            <button 
                                onClick={() => setReminder(milestone.id, step.id, getQuickPresetTime(7, 9))}
                                className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 rounded-xl hover:bg-[var(--primary-soft)] hover:text-[var(--primary-text)] hover:border-[var(--primary-shadow)] transition-all"
                            >
                                🚀 In 1 Week
                            </button>
                            <button 
                                onClick={() => setReminder(milestone.id, step.id, '')}
                                className="px-3 py-2 text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all"
                            >
                                🗑️ Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Growth Velocity</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="progress" stroke={primaryColor} strokeWidth={3} fillOpacity={1} fill="url(#colorProg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-[var(--primary-soft)] overflow-hidden relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <h3 className="font-bold text-slate-800">AI Strategy Room</h3>
                </div>
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="text-[10px] font-black uppercase tracking-widest text-[var(--primary-text)] hover:opacity-80 transition-opacity flex items-center gap-1 disabled:opacity-50"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Refresh Insights'}
                </button>
            </div>

            {isAnalyzing ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-3">
                        <div className="w-5 h-5 bg-slate-100 rounded shrink-0"></div>
                        <div className="space-y-2 flex-1">
                            <div className="h-3 bg-slate-100 rounded w-full"></div>
                        </div>
                    </div>
                ))}
              </div>
            ) : aiInsights.length > 0 ? (
              <div className="space-y-5">
                {aiInsights.map((insight, i) => (
                  <div key={i} className="flex gap-3 animate-fade-in group">
                    <div className="mt-1 shrink-0 w-8 h-8 rounded-xl bg-white border border-slate-100 text-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        {insight.icon}
                    </div>
                    <div className="flex-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
                            {insight.type}
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {insight.text}
                        </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <button 
                  onClick={handleAnalyze}
                  className="px-6 py-2.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded-xl shadow-lg shadow-[var(--primary-shadow)] hover:scale-105 transition-all"
                >
                  Generate AI Analysis
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-[var(--primary-soft)]">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                <span className="text-[var(--primary-soft)] text-lg">💡</span> Coaching Note
            </h3>
            <p className="text-slate-300 text-sm italic leading-relaxed">
              "Every stride counts. Stay consistent and let AI navigate the complexity while you focus on the action."
            </p>
          </div>
        </div>
      </div>

      <ExportSocialModal 
        isOpen={isSocialModalOpen} 
        onClose={() => setIsSocialModalOpen(false)} 
        journey={journey}
      />
    </div>
  );
};

export default JourneyDetail;
