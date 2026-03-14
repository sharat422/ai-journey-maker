import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-4xl mx-auto py-4">
        <div className="space-y-8">
          <div className="prose prose-slate max-w-none space-y-8">

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-800">1. Acceptance of Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                By accessing or using PrimePro (“the Service”), including AI content generation,
                the Synthetic Twin (“Synth Twin”), and stored memory features, you agree to be bound
                by these Terms of Service. If you do not agree, do not use the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-800">2. Description of Service</h2>
              <p className="text-slate-600 leading-relaxed">
                PrimePro provides AI-powered tools for content creation, video scripts, blogs,
                marketing material, and a personalized AI assistant (“Synth Twin”). 
                The Synth Twin learns from user inputs, stores preferences and goals,
                and uses this information to provide personalized responses.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The Service may store your inputs, generated outputs, and interaction history
                to improve personalization and functionality.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-800">3. User Accounts</h2>
              <p className="text-slate-600 leading-relaxed">
                You must create an account to access certain features. You are responsible for
                keeping your login credentials secure. Activity occurring under your account is
                your responsibility.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-800">4. AI-Generated Content</h2>
              <p className="text-slate-600 leading-relaxed">
                You understand that AI-generated content may be inaccurate, incomplete, or
                inappropriate. PrimePro does not guarantee the accuracy or reliability
                of AI outputs including Synth Twin conversations or generated content. 
                You are responsible for reviewing content before use.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-800">5. Stored Data & Synth Twin Memory</h2>
              <p className="text-slate-600 leading-relaxed">
                The Service stores user inputs, conversation history, preferences, goals,
                and generated content to power the Synth Twin and other personalization features.
                By using the platform, you consent to this data storage.
              </p>
              <p className="text-slate-600 leading-relaxed">
                You may request deletion of stored memories or account data at any time
                by contacting support.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-800">6. Payments, Credits, and Subscriptions</h2>
              <p className="text-slate-600 leading-relaxed">
                Paid features require purchasing credits or subscribing to a paid plan
                through Stripe. Charges are non-refundable except where required by law.
                Subscriptions renew automatically unless cancelled.
              </p>
              <p className="text-slate-600 leading-relaxed">
                You agree to comply with Stripe’s terms and authorize recurring charges
                if you subscribe to a paid plan.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-800">7. Acceptable Use</h2>
              <ul className="list-disc pl-6 text-slate-600 space-y-1">
                <li>No illegal, harmful, or abusive content.</li>
                <li>No attempts to reverse engineer the system or AI models.</li>
                <li>No automated scraping or misuse of the platform.</li>
                <li>No generating or uploading unlawful or copyrighted content without permission.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-800">8. Data and Privacy</h2>
              <p className="text-slate-600 leading-relaxed">
                Your privacy is important to us. The Privacy Policy explains how data is collected,
                stored, and processed, including memory stored for Synth Twin personalization.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-800">9. Limitation of Liability</h2>
              <p className="text-slate-600 leading-relaxed">
                PrimePro is provided “as-is.” We are not liable for damages including data loss,
                inaccuracies in AI output, or business losses resulting from use of the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-800">10. Termination</h2>
              <p className="text-slate-600 leading-relaxed">
                We may suspend or terminate your access for violating these Terms or for harmful activity.
                You may delete your account at any time.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-800">11. Changes to Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                We may update these Terms periodically. Continued use constitutes acceptance of updated Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-800">12. Contact Information</h2>
              <p className="text-slate-600 leading-relaxed">
                For questions or concerns, contact us:
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                <strong>Email:</strong> creativeaimsr@gmail.com
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
