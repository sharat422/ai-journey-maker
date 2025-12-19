
import React, { useState } from 'react';
import { generateJourney } from '../services/geminiService';
import { Journey } from '../types';

interface JourneyBuilderProps {
  onJourneyCreated: (journey: Journey) => void;
  onCancel: () => void;
  isPro: boolean;
}

const JourneyBuilder: React.FC<JourneyBuilderProps> = ({ onJourneyCreated, onCancel, isPro }) => {
  const [goal, setGoal] = useState('');
  const [timeframe, setTimeframe] = useState('4 weeks');
  const [selectedModel, setSelectedModel] = useState<'gemini-3-flash-preview' | 'gemini-3-pro-preview'>(
    isPro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setLoading(true);
    setError('');
    try {
      const journey = await generateJourney(goal, timeframe, selectedModel);
      onJourneyCreated(journey);
    } catch (err) {
      setError('Something went wrong. Please check your API key or connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-xl animate-fade-in border border-slate-50">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-slate-800">Start Your Next Journey</h2>
        </div>
        <p className="text-slate-500 mt-2">Describe what you want to achieve, and choose your AI architect.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Model Selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Intelligence Level</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3-flash-preview')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                selectedModel === 'gemini-3-flash-preview'
                  ? 'border-[var(--primary)] bg-[var(--primary-soft)] ring-2 ring-[var(--primary)] ring-inset'
                  : 'border-slate-200 hover:border-[var(--primary-shadow)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">Gemini 3 Flash</span>
                {selectedModel === 'gemini-3-flash-preview' && (
                  <svg className="w-4 h-4 text-[var(--primary-text)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-snug">Lightning fast. Perfect for general skill acquisition and hobby projects.</p>
            </button>

            <div className="relative">
              <button
                type="button"
                disabled={!isPro}
                onClick={() => setSelectedModel('gemini-3-pro-preview')}
                className={`w-full p-4 rounded-2xl border text-left transition-all h-full ${
                  !isPro
                    ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                    : selectedModel === 'gemini-3-pro-preview'
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500 ring-inset'
                    : 'border-slate-200 hover:border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold ${!isPro ? 'text-slate-400' : 'text-slate-900'}`}>Gemini 3 Pro</span>
                  {!isPro ? (
                    <span className="bg-slate-200 text-slate-500 text-[8px] px-1.5 py-0.5 rounded font-black uppercase">PRO</span>
                  ) : selectedModel === 'gemini-3-pro-preview' && (
                    <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-snug">Deep reasoning. Best for professional careers, complex science, and long-term mastery.</p>
              </button>
              {!isPro && (
                <div className="absolute inset-x-0 -bottom-6 text-center">
                  <span className="text-[10px] font-bold text-[var(--primary-text)] uppercase tracking-tight">Requires Pro Subscription</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 mt-2">My Goal</label>
          <textarea
            required
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none transition-all min-h-[100px]"
            placeholder="e.g., Become a Senior Frontend Engineer specialized in Three.js..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
          >
            <option value="1 week">1 Week (Sprint)</option>
            <option value="4 weeks">4 Weeks (Standard)</option>
            <option value="3 months">3 Months (Medium Term)</option>
            <option value="6 months">6 Months (Deep Dive)</option>
            <option value="1 year">1 Year (Long Term)</option>
            {isPro && <option value="2 years">2 Years (Pro Ultra-Long)</option>}
          </select>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {selectedModel === 'gemini-3-pro-preview' && (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM6.464 14.95a1 1 0 00-1.414 0l-.707.707a1 1 0 001.414 1.414l.707-.707a1 1 0 000-1.414z" />
              </svg>
            </div>
            <p className="text-xs text-amber-800 leading-tight">
              <strong>Advanced Reasoning Active:</strong> The Pro model is processing your request with a higher thinking budget for superior structural planning.
            </p>
          </div>
        )}

        <div className="flex gap-4 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 px-6 py-3 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-slate-400' 
                : selectedModel === 'gemini-3-pro-preview' 
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' 
                : 'bg-[var(--primary)] hover:opacity-90 shadow-[var(--primary-shadow)]'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Thinking...
              </>
            ) : (
              'Generate Roadmap'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JourneyBuilder;
