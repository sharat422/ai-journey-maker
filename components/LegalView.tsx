
import React from 'react';

interface LegalViewProps {
  type: 'privacy' | 'terms';
  onBack: () => void;
}

const LegalView: React.FC<LegalViewProps> = ({ type, onBack }) => {
  const isPrivacy = type === 'privacy';

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 animate-fade-in">
      <button 
        onClick={onBack}
        className="text-[var(--primary-text)] hover:opacity-80 font-bold text-sm mb-8 flex items-center gap-1 group transition-all"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
      </button>

      <div className="prose prose-slate max-w-none">
        <h1 className="text-4xl font-black text-slate-900 mb-6">
          {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
        </h1>
        <p className="text-slate-500 text-sm mb-8">Brand: Stride AI | Updated: Oct 2024</p>

        {isPrivacy ? (
          <div className="space-y-6 text-slate-600 leading-relaxed text-sm">
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3">1. Introduction</h2>
              <p>Welcome to Stride AI. We are dedicated to helping you achieve goals while keeping your data private. This policy outlines how your strides are managed.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3">2. Data Storage</h2>
              <p>Stride stores your journey data locally in your browser. We only send your goal text to Google's Gemini API for roadmap generation.</p>
            </section>
          </div>
        ) : (
          <div className="space-y-6 text-slate-600 leading-relaxed text-sm">
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3">1. Terms</h2>
              <p>By using Stride, you agree to these terms. Stride is an AI coaching platform provided for informational and motivational purposes.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3">2. Pro Subscription</h2>
              <p>Stride Pro offers advanced features. Payments are handled via Stripe and are non-refundable after the cycle begins.</p>
            </section>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center">
            <button 
                onClick={onBack}
                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg"
            >
                Continue
            </button>
        </div>
      </div>
    </div>
  );
};

export default LegalView;
