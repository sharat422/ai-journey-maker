
import React, { useRef, useState } from 'react';
import { Journey, User } from '../types';

interface GrowthSharingModalProps {
    isOpen: boolean;
    onClose: () => void;
    journey: Journey;
    user: User;
    streak: number;
}

const GrowthSharingModal: React.FC<GrowthSharingModalProps> = ({ isOpen, onClose, journey, user, streak }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const handleShare = (platform: 'twitter' | 'linkedin' | 'instagram' | 'download') => {
        const text = `I'm on a ${streak} day streak tracking "${journey.title}" with PrimePro AI! 🚀\n\n#BuildingInPublic #GrowthMindset`;
        const url = window.location.origin; // Or app landing page

        if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        } else if (platform === 'linkedin') {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        } else if (platform === 'instagram') {
            // Instagram doesn't have a simple web share intent for image + text
            alert("To share on Instagram, take a screenshot of this card and post it to your Story! 📸");
        } else if (platform === 'download') {
            // In a full implementation, we'd use html2canvas
            alert("Right-click (or long press) the card above to save the image!");
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative border border-slate-100 flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Share your growth</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                {/* Preview Area */}
                <div className="p-8 bg-slate-50 flex justify-center">
                    <div
                        ref={canvasRef}
                        className="w-full aspect-square bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between"
                    >
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl -ml-5 -mb-5"></div>

                        {/* Content */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <span className="text-2xl">🔥</span>
                                </div>
                                <div>
                                    <div className="text-xs font-bold opacity-70 uppercase tracking-widest">Current Streak</div>
                                    <div className="text-2xl font-black">{streak} Days</div>
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold leading-tight mb-2">I'm tracking my growth in {journey.category}</h2>
                            <p className="opacity-80 text-sm">"{journey.title}"</p>
                        </div>

                        {/* Graph Mock */}
                        <div className="w-full h-24 flex items-end gap-1 opacity-50">
                            {[30, 45, 40, 60, 55, 75, 80].map((h, i) => (
                                <div key={i} className="flex-1 bg-white rounded-t-sm" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>

                        {/* Footer / Watermark */}
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                                {user.avatar && <img src={user.avatar} className="w-8 h-8 rounded-full border-2 border-white/50" alt="" />}
                                <div className="text-xs font-bold">{user.name || "Use"}</div>
                            </div>
                            {!user.isPro && (
                                <div className="text-[10px] font-black opacity-60 bg-black/20 px-2 py-1 rounded">
                                    Built with PrimePro AI
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6">
                    <p className="text-center text-slate-500 text-sm mb-4">Sharing your progress helps you stay accountable.</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button onClick={() => handleShare('twitter')} className="flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl font-bold hover:opacity-80 transition">
                            <span className="text-lg">𝕏</span> Share on X
                        </button>
                        <button onClick={() => handleShare('linkedin')} className="flex items-center justify-center gap-2 py-3 bg-[#0a66c2] text-white rounded-xl font-bold hover:opacity-90 transition">
                            <span className="text-lg">in</span> LinkedIn
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleShare('instagram')} className="flex items-center justify-center gap-2 py-3 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white rounded-xl font-bold hover:opacity-90 transition">
                            📸 Instagram
                        </button>
                        <button onClick={() => handleShare('download')} className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition">
                            ⬇ Download
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GrowthSharingModal;
