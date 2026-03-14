
import { loadStripe } from '@stripe/stripe-js';
import { getStripe } from './stripeUtility';

const STRIPE_PUBLIC_KEY = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY;
const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL;

export const paymentService = {
  async createCheckoutSession(userId: string, plan: 'monthly' | 'yearly' | 'streak_freeze' | 'extra_goal') {
    const url = BACKEND_URL ? `${BACKEND_URL}/api/create-checkout-session` : '/api/create-checkout-session';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        plan: plan,
        success_url: `${window.location.origin}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}`
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create session';
      try {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorData.message || errorMessage;
          console.error("Backend Error Detail:", errorData);
        } catch (parseError) {
          console.error("Backend Error Text:", errorText);
          errorMessage = errorText || errorMessage;
        }
      } catch (e) {
        console.error("Failed to read error response", e);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // DEBUG: Ensure this prints a string, not undefined
    console.log("Session ID received:", data.sessionId);

    return data.sessionId;
  },

  async redirectToCheckout(sessionId: string) {
    const stripe = await getStripe(); // Ensure this returns your Stripe instance
    if (!stripe) throw new Error('Stripe failed to initialize');

    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) throw error;
  }
};
