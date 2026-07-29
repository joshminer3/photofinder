import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import type { Database } from "@/lib/types/database";

// Must use the service role key — RLS would block writing subscription
// state from an anon/authenticated context, and these columns should never
// be reachable through the anon key anyway.
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Stripe's ID fields come back as either a plain string or an expanded
// object depending on what was requested — webhook payloads are unexpanded,
// but this stays correct either way instead of blindly casting to string.
function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export async function POST(req: Request) {
  // Signature verification needs the raw, unparsed body. In the App Router,
  // req.text() already gives that directly — there's no body-parser
  // middleware to disable here (that's a Pages Router API routes concern).
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = idOf(session.customer);
        const subscriptionId = idOf(session.subscription);
        const photographerUserId = session.metadata?.photographer_user_id;

        if (!photographerUserId || !customerId || !subscriptionId) break;

        const { error } = await supabase
          .from("photographer_profiles")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
          })
          .eq("user_id", photographerUserId);

        if (error) console.error("Failed to record checkout completion:", error);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status;
        const mappedStatus =
          status === "active"
            ? "active"
            : status === "past_due"
              ? "past_due"
              : status === "canceled"
                ? "canceled"
                : "inactive";

        // current_period_end now lives per subscription item rather than on
        // the subscription itself; this app only ever creates single-item
        // subscriptions (one price), so the first item is the right one.
        const periodEnd = subscription.items.data[0]?.current_period_end;

        const { error } = await supabase
          .from("photographer_profiles")
          .update({
            subscription_status: mappedStatus,
            subscription_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) console.error("Failed to update subscription status:", error);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const { error } = await supabase
          .from("photographer_profiles")
          .update({
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) console.error("Failed to record subscription deletion:", error);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription ?? null);

        if (!subscriptionId) break;

        const { error } = await supabase
          .from("photographer_profiles")
          .update({ subscription_status: "past_due" })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) console.error("Failed to record payment failure:", error);

        // TODO (future): send payment failed email via Resend
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
