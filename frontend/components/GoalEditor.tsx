import React, { useState, useEffect } from 'react';
import { Goal } from '../types';

interface GoalEditorProps {
  goal?: Goal | null;
  initialDate?: Date;
  onSave: (data: { title: string; description: string; dateTime: string }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const GoalEditor: React.FC<GoalEditorProps> = ({ goal, initialDate, onSave, onCancel, isSaving = false }) => {
  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [date, setDate] = useState(goal ? new Date(goal.dateTime).toISOString().split('T')[0] : (initialDate ? initialDate.toISOString().split('T')[0] : ''));
  const [time, setTime] = useState(goal ? new Date(goal.dateTime).toTimeString().slice(0, 5) : (initialDate ? initialDate.toTimeString().slice(0, 5) : ''));
  const [errors, setErrors] = useState<{ title?: string; dateTime?: string }>({});

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description || '');
      const dt = new Date(goal.dateTime);
      setDate(dt.toISOString().split('T')[0]);
      setTime(dt.toTimeString().slice(0, 5));
    } else if (initialDate) {
      setDate(initialDate.toISOString().split('T')[0]);
      setTime(initialDate.toTimeString().slice(0, 5));
    }
  }, [goal, initialDate]);

  const validate = () => {
    const newErrors: { title?: string; dateTime?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    const dateTimeStr = `${date}T${time}`;
    if (!date || !time || isNaN(new Date(dateTimeStr).getTime())) {
      newErrors.dateTime = 'Valid date and time are required';
    } else if (new Date(dateTimeStr) < new Date()) {
      newErrors.dateTime = 'Date and time must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const dateTime = new Date(`${date}T${time}`).toISOString();
      onSave({ title: title.trim(), description: description.trim(), dateTime });
    }
  };

  const isEditing = !!goal;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <button
        onClick={onCancel}
        className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Cancel
      </button>

      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">
          {isEditing ? 'Edit Goal' : 'Create New Goal'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
              Goal Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your goal..."
              className={`w-full px-4 py-3 rounded-xl border ${errors.title ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-[var(--primary)]'} focus:outline-none focus:ring-2 transition-all text-slate-800`}
              disabled={isSaving}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your goal..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-[var(--primary)] focus:outline-none focus:ring-2 transition-all text-slate-800 resize-none"
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-semibold text-slate-700 mb-2">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${errors.dateTime ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-[var(--primary)]'} focus:outline-none focus:ring-2 transition-all text-slate-800`}
                disabled={isSaving}
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-semibold text-slate-700 mb-2">
                Time
              </label>
              <input
                type="time"
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${errors.dateTime ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-[var(--primary)]'} focus:outline-none focus:ring-2 transition-all text-slate-800`}
                disabled={isSaving}
              />
            </div>
          </div>
          {errors.dateTime && (
            <p className="text-sm text-red-500">{errors.dateTime}</p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-[var(--primary-shadow)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {isEditing ? 'Update Goal' : 'Create Goal'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalEditor;