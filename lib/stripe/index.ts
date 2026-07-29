import Stripe from "stripe";

// No apiVersion pin here on purpose — the installed SDK version bakes in its
// own default pinned version (see Stripe.API_VERSION), so hardcoding a
// literal here just risks drifting out of sync with what the SDK actually
// sends. Upgrading the `stripe` package is what moves the pinned version.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});
