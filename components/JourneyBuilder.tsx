
import React, { useState } from 'react';
import { generateJourney } from '../services/geminiService';
import { Journey } from '../types';

interface JourneyBuilderProps {
  onJourneyCreated: (journey: Journey) => void;
  onCancel: () => void;
}

const JourneyBuilder: React.FC<JourneyBuilderProps> = ({ onJourneyCreated, onCancel }) => {
  const [goal, setGoal] = useState('');
  const [timeframe, setTimeframe] = useState('4 weeks');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setLoading(true);
    setError('');
    try {
      const journey = await generateJourney(goal, timeframe);
      onJourneyCreated(journey);
    } catch (err) {
      setError('Something went wrong. Please check your API key or connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-xl animate-fade-in border border-indigo-50">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Start Your Next Journey</h2>
        <p className="text-slate-500 mt-2">Describe what you want to achieve, and let AI build the roadmap.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">My Goal</label>
          <textarea
            required
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all min-h-[120px]"
            placeholder="e.g., Become proficient in WebGL and shaders, Run a half marathon, Learn to cook Japanese cuisine..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="1 week">1 Week (Sprint)</option>
            <option value="4 weeks">4 Weeks (Standard)</option>
            <option value="3 months">3 Months (Medium Term)</option>
            <option value="6 months">6 Months (Deep Dive)</option>
            <option value="1 year">1 Year (Long Term)</option>
          </select>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
            {error}
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
            className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              'Generate Journey'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JourneyBuilder;
