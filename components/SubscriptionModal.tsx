
import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';
import { auth } from '../services/authService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    const user = auth.getCurrentUser();
    if (!user) {
      setError("You must be logged in to subscribe.");
      setLoading(false); // Stop loading if no user
      return;
    }
    setStep('processing');

    try {
      // 1. Get the session ID from your FastAPI backend
      const sessionId = await paymentService.createCheckoutSession(user.id, billingCycle);

      if (!sessionId) {
        throw new Error("No session ID returned from the server.");
      }
      // 3. This opens the Stripe page
      await paymentService.redirectToCheckout(sessionId);

    } catch (err: any) {
      console.error("Payment failed:", err);
      setError("Stripe Checkout failed to load. Please try again.");
      setStep('details');
    } finally {
      setLoading(false);
    }
  };

  const currentPrice = billingCycle === 'monthly' ? '$6.99' : '$49.99';
  const currentInterval = billingCycle === 'monthly' ? '/ mo' : '/ year';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in border border-slate-100">
        {step === 'details' && (
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900"> Pro</h2>
                <p className="text-slate-500 text-sm font-medium">Elevate your growth experience</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-black">
                  {currentPrice}
                </div>
              </div>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${billingCycle === 'monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Monthly {billingCycle === 'monthly' && '✓'}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${billingCycle === 'yearly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Yearly {billingCycle === 'yearly' && '✓'}
              </button>
            </div>

            <div className="space-y-4 mb-8">
              {[
                "Advanced AI structural reasoning",
                "Unlimited custom roadmaps",
                "Priority cloud processing",
                "HD Cinematic video exports"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>

            {error && <p className="text-red-500 text-xs font-bold mb-4">{error}</p>}

            <div className="flex gap-4">
              <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-400 text-sm rounded-xl border border-slate-100 hover:bg-slate-50 transition-all">
                Close
              </button>
              <button onClick={handlePay} className="flex-1 py-3 font-bold text-white text-sm bg-indigo-600 rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">
                Pay Securely
              </button>

            </div>
            <h3 className="text-center text-xs text-slate-400 mt-2">
              Start 7-Day Free Trial,  Cancel anytime.
            </h3>
            <p className="text-center text-[10px] text-slate-400 mt-6 uppercase tracking-widest font-black">
              SECURE STRIPE CHECKOUT
            </p>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Redirecting to Stripe</h3>
              <p className="text-slate-500 text-sm font-medium">Starting your secure checkout session...</p>
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
              <h3 className="text-xl font-bold text-slate-900">Payment Successful</h3>
              <p className="text-slate-500 text-sm font-medium">Welcome to Pro.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionModal;
