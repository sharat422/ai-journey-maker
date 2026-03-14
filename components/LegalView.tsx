
import React from 'react';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';



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
        <p className="text-slate-500 text-sm mb-8">Brand: PrimePro | Updated: Jan 2026</p>

        {isPrivacy ? (
          <PrivacyPolicy />
        ) : (

          <TermsOfService />
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
