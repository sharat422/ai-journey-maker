
import React, { useState } from 'react';
import { Journey } from '../types';
import { generateProgressVideo } from '../services/geminiService';

interface ExportSocialModalProps {
  journey: Journey;
  isOpen: boolean;
  onClose: () => void;
}

const ExportSocialModal: React.FC<ExportSocialModalProps> = ({ journey, isOpen, onClose }) => {
  const [status, setStatus] = useState<string>('Ready to generate');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartGeneration = async () => {
    if (!(window as any).aistudio?.hasSelectedApiKey || !await (window as any).aistudio.hasSelectedApiKey()) {
      setStatus("Select a key for video generation...");
      await (window as any).aistudio.openSelectKey();
    }

    setLoading(true);
    setError(null);
    try {
      const url = await generateProgressVideo(journey, (s) => setStatus(s));
      setVideoUrl(url);
      setStatus("Your reel is ready!");
    } catch (err) {
      setError("Reel generation failed. Check your paid API key status.");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `Stride_Reel_${journey.title.replace(/\s+/g, '_')}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-800 text-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-700">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Stride Reel Studio</h2>
              <p className="text-slate-400 text-sm">Create a cinematic video of your progress.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="aspect-[9/16] bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden flex flex-col items-center justify-center relative group">
              {videoUrl ? (
                <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
              ) : (
                <div className="text-center px-6">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                      <p className="text-xs font-bold text-indigo-400 animate-pulse">{status}</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
                        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-400">Your custom Stride reel will appear here.</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Includes:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="text-indigo-400">✔</span> {journey.progress}% Growth Visuals
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="text-indigo-400">✔</span> 9:16 Social Format
                  </li>
                </ul>
              </div>

              {error && <p className="text-red-400 text-xs font-bold bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}

              {!videoUrl ? (
                <button
                  onClick={handleStartGeneration}
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? 'Generating...' : 'Start Production'}
                </button>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={handleDownload}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    Download Reel
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <a href="https://www.tiktok.com/upload" target="_blank" rel="noopener noreferrer" className="py-3 bg-black rounded-2xl text-center text-xs font-bold border border-slate-700 flex items-center justify-center gap-2">
                      Post to TikTok
                    </a>
                    <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="py-3 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-2">
                      Post to Instagram
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportSocialModal;
