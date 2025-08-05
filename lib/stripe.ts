import { loadStripe } from '@stripe/stripe-js';

// Stripe Publishable Key aus Umgebungsvariablen
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default stripePromise;
