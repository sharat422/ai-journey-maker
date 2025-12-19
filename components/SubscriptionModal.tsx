
import React, { useState } from 'react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  if (!isOpen) return null;

  const handlePay = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
        setStep('details');
      }, 2000);
    }, 2500);
  };

  const currentPrice = billingCycle === 'monthly' ? '$6.99' : '$49.99';
  const currentInterval = billingCycle === 'monthly' ? '/ mo' : '/ year';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in transform scale-100 border border-slate-100">
        {step === 'details' && (
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Stride Pro</h2>
                <p className="text-slate-500 text-sm">Unlock advanced AI reasoning</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="bg-[var(--primary)] text-white px-3 py-1 rounded-full text-xs font-black transition-all">
                  {currentPrice} {currentInterval}
                </div>
                {billingCycle === 'yearly' && (
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-tighter">Save 40% annually</span>
                )}
              </div>
            </div>

            {/* Billing Toggle */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${billingCycle === 'monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${billingCycle === 'yearly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Yearly
              </button>
            </div>

            <div className="space-y-4 mb-8">
              {[
                "Advanced 'Gemini 3 Pro' Reasoning",
                "Unlimited roadmap generations",
                "Priority AI processing",
                "Custom cinematic video reels"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-[var(--primary)] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Secure Payment</label>
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3">
                  <div className="w-8 h-5 bg-slate-300 rounded-sm"></div>
                  <input type="text" disabled value="**** **** **** 4242" className="bg-transparent outline-none text-slate-400 flex-1 text-sm" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-500 text-sm rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                Maybe later
              </button>
              <button onClick={handlePay} className="flex-1 py-3 font-bold text-white text-sm bg-slate-900 rounded-xl shadow-lg hover:bg-slate-800 transition-all">
                Subscribe
              </button>
            </div>
            
            <p className="text-center text-[10px] text-slate-400 mt-6 uppercase tracking-widest font-bold">
              Securely processed by <span className="text-slate-600">Stripe</span>
            </p>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-[var(--primary)] rounded-full animate-spin"></div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Setting up your access</h3>
              <p className="text-slate-500 text-sm">Starting your {billingCycle} Stride journey...</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">You're all set!</h3>
              <p className="text-slate-500 text-sm">Stride Pro is now active on your account.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionModal;
