
import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';
import { auth } from '../services/authService';

interface MonetizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'value_unlock' | 'limit_reached' | 'premium_upgrade';
    streakDays?: number;
    identityName?: string; // for "Become X" path unlock
    onActionComplete: (action: string) => void;
}

const MonetizationModal: React.FC<MonetizationModalProps> = ({
    isOpen, onClose, mode, streakDays = 3, identityName = "this version", onActionComplete
}) => {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handlePurchase = async (type: 'buy_freeze' | 'buy_goal' | 'buy_path') => {
        setLoading(true);
        const user = auth.getCurrentUser();
        if (!user) { alert("Please log in first."); setLoading(false); return; }

        let planType: 'streak_freeze' | 'extra_goal' | null = null;
        if (type === 'buy_freeze') planType = 'streak_freeze';
        if (type === 'buy_goal') planType = 'extra_goal';

        if (planType) {
            try {
                const sessionId = await paymentService.createCheckoutSession(user.id, planType);
                await paymentService.redirectToCheckout(sessionId);
            } catch (err: any) {
                console.error("Purchase Failed:", err);
                alert("Failed to initialize purchase: " + err.message);
                setLoading(false);
            }
        } else {
            // 'buy_path' logic or others
            alert("This feature is coming soon!");
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (mode) {
            case 'value_unlock':
                return (
                    <>
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                            <span className="text-3xl">🔥</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">You’re building momentum</h3>
                        <p className="text-slate-600 mb-6">
                            You’ve stayed consistent for <span className="font-bold text-orange-600">{streakDays} days</span>.<br />
                            Unlock deeper insights and protect your progress.
                        </p>
                        <div className="space-y-3 w-full">
                            <button onClick={() => onActionComplete('unlock_insight')} className="w-full py-3 bg-[var(--primary)] text-white font-bold rounded-xl hover:opacity-90 shadow-lg">
                                Unlock Today’s Insight (Free)
                            </button>
                            <button onClick={() => onActionComplete('save_streak')} className="w-full py-3 bg-white border-2 border-[var(--primary)] text-[var(--primary-text)] font-bold rounded-xl hover:bg-slate-50">
                                Save My Streak
                            </button>
                            <button onClick={onClose} className="text-sm text-slate-400 font-medium hover:text-slate-600">
                                Maybe Later
                            </button>
                        </div>
                    </>
                );

            case 'limit_reached':
                return (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <span className="text-3xl">🛑</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Don’t break your progress</h3>
                        <p className="text-slate-600 mb-6">
                            You’re doing great. This feature helps you stay consistent without starting over.
                        </p>
                        <div className="space-y-3 w-full">
                            <div onClick={() => handlePurchase('buy_freeze')} className="p-4 border border-slate-200 rounded-xl hover:border-blue-500 cursor-pointer transition-all flex justify-between items-center group">
                                <div className="text-left">
                                    <div className="font-bold text-slate-800 group-hover:text-blue-600">🧊 Streak Freeze (7 days)</div>
                                    <div className="text-xs text-slate-500">Protect your streak for a week</div>
                                </div>
                                <div className="font-bold text-slate-900">$0.99</div>
                            </div>
                            <div onClick={() => handlePurchase('buy_goal')} className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500 cursor-pointer transition-all flex justify-between items-center group">
                                <div className="text-left">
                                    <div className="font-bold text-slate-800 group-hover:text-emerald-600">🎯 Unlock 1 Extra Goal</div>
                                    <div className="text-xs text-slate-500">Track one more ambition</div>
                                </div>
                                <div className="font-bold text-slate-900">$2.99</div>
                            </div>
                            {/* Optional Path Unlock */}
                            <div onClick={() => handlePurchase('buy_path')} className="p-4 border border-slate-200 rounded-xl hover:border-purple-500 cursor-pointer transition-all flex justify-between items-center group">
                                <div className="text-left">
                                    <div className="font-bold text-slate-800 group-hover:text-purple-600">🚀 Unlock Path</div>
                                    <div className="text-xs text-slate-500">Deep dive roadmap</div>
                                </div>
                                <div className="font-bold text-slate-900">$3.99</div>
                            </div>

                            <p className="text-[10px] text-slate-400 font-medium mt-2">One-time purchase. Instant access.</p>
                        </div>
                        <button onClick={onClose} className="mt-4 text-sm text-slate-400 font-medium hover:text-slate-600">
                            No thanks
                        </button>
                    </>
                );

            case 'premium_upgrade':
                return (
                    <>
                        <div className="w-16 h-16 bg-gradient-to-tr from-amber-300 to-orange-500 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg shadow-orange-200">
                            <span className="text-3xl text-white">👑</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Become the version you’re working toward</h3>
                        <p className="text-slate-600 mb-6 text-sm">
                            You’ve already proven you can stay consistent. Premium gives you everything you need to keep growing — without limits.
                        </p>

                        <ul className="text-left space-y-2 mb-8 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl">
                            <li className="flex items-center gap-2">✅ Unlimited goals & habits</li>
                            <li className="flex items-center gap-2">✅ All streak protection</li>
                            <li className="flex items-center gap-2">✅ AI growth coach insights</li>
                            <li className="flex items-center gap-2">✅ All identity-based paths</li>
                        </ul>

                        <div className="space-y-3 w-full">
                            <button onClick={() => onActionComplete('sub_monthly')} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg">
                                Go Premium — $4.99 / month
                            </button>
                            <button onClick={() => onActionComplete('sub_yearly')} className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 shadow-lg relative overflow-hidden">
                                <span className="relative z-10">Save 60% — $39 / year ⭐</span>
                            </button>
                            <button onClick={onClose} className="text-sm text-slate-400 font-medium hover:text-slate-600">
                                Not Now
                            </button>
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative p-8 flex flex-col items-center text-center">
                {/* Decorative background blobs */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--primary)] to-purple-500"></div>
                {renderContent()}
            </div>
        </div>
    );
};

export default MonetizationModal;
