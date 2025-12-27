
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { db } from '../services/dbService';
import { auth } from '../services/authService';

interface SettingsViewProps {
  user: User;
  onBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onBack }) => {
  const [name, setName] = useState(user.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic size validation (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 2MB' });
      return;
    }

    setIsUploading(true);
    setMessage(null);
    try {
      const publicUrl = await db.uploadAvatar(user.id, file);
      setAvatarUrl(publicUrl);
      // Immediately update profile in DB to sync
      await db.updateProfile(user.id, { avatar_url: publicUrl });
      await auth.refreshUser();
      setMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to upload avatar. Check bucket permissions.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);

    try {
      await db.updateProfile(user.id, { name, avatar_url: avatarUrl });
      await auth.refreshUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <button 
        onClick={onBack}
        className="text-[var(--primary-text)] hover:opacity-80 font-medium mb-8 flex items-center gap-1 group transition-all"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
      </button>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-12">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Profile Settings</h2>
          <p className="text-slate-500 mb-10">Manage your public identity and account preferences.</p>

          <form onSubmit={handleSave} className="space-y-8">
            <div className="flex flex-col items-center">
              <div 
                onClick={handleAvatarClick}
                className="relative group cursor-pointer"
              >
                <div className="w-32 h-32 rounded-full border-4 border-slate-50 shadow-xl overflow-hidden relative bg-slate-100 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <div className="text-4xl font-black text-slate-300">
                      {name.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                     <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                     </svg>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Click to Change Avatar</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all text-sm font-medium"
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Read Only)</label>
                <input 
                  type="email" 
                  disabled
                  value={user.email}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 opacity-60 text-sm font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-2xl text-[11px] font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-4 pt-4">
               <button 
                 type="submit" 
                 disabled={isUpdating || isUploading}
                 className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 active:scale-95"
               >
                 {isUpdating ? 'Saving...' : 'Save Changes'}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
