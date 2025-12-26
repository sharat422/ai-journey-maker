
import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PUBLIC_KEY = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY;
const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL;

export const paymentService = {
  async redirectToCheckout(priceId: 'monthly' | 'yearly') {
    if (!STRIPE_PUBLIC_KEY) {
      throw new Error("Stripe Public Key is missing.");
    }

    const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
    if (!stripe) throw new Error("Stripe failed to initialize.");

    /**
     * PRODUCTION FLOW:
     * We send a request to our backend (Supabase Function) to create a secure checkout session.
     */
    try {
      const response = await fetch(`${BACKEND_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: priceId,
          success_url: window.location.origin + '?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: window.location.origin
        }),
      });

      const { sessionId } = await response.json();

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
      
      return true;
    } catch (err) {
      console.error("Payment redirect error:", err);
      // Fallback for demonstration if backend isn't ready yet
      alert("Note: To use real Stripe payments, ensure your VITE_BACKEND_URL is set and your server is creating a Checkout Session.");
      throw err;
    }
  }
};
