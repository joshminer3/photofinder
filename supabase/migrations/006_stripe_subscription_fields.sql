-- Foto: Stripe subscription tracking (Session 5 — infrastructure only, no UI yet)
--
-- These columns are only ever read/written by server-side code using the
-- service role key (the Stripe webhook handler and the checkout/portal API
-- routes) — never through the anon or authenticated Supabase client. No RLS
-- policy changes are needed for that: the existing policies only grant
-- access to authenticated/anon roles, and the service role bypasses RLS
-- entirely, so simply never touching these columns from an anon/authed
-- client is what keeps them private. Application code must keep honoring
-- that; see lib/stripe/*.

alter table public.photographer_profiles
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column subscription_status text default 'inactive' not null,
  -- possible values: 'inactive', 'active', 'past_due', 'canceled'
  add column subscription_period_end timestamptz;

create index idx_photographer_stripe_customer
  on public.photographer_profiles (stripe_customer_id);

create index idx_photographer_stripe_subscription
  on public.photographer_profiles (stripe_subscription_id);
