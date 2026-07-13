# Foto — Development Brief
## Session 1: Foundation, Auth & Photographer Profile

---

## What We're Building

**Foto** is a photographer discovery marketplace for Utah (expanding later). Clients find and contact photographers filtered by specialty, location, price, and availability. Photographers get a clean public profile that generates real inbound leads — their alternative to hoping Instagram's algorithm delivers clients.

This is a two-sided marketplace. The cold-start problem (need photographers before clients, need clients before photographers) is the core business risk — the tech is not. Build lean and fast.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Database / Auth | Supabase |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Email (transactional) | Resend |
| File storage | Supabase Storage |
| Payments (later) | Stripe |

---

## Session 1 Goals

By the end of this session we want:

1. **Supabase schema** created and applied — all core tables, relationships, and RLS policies
2. **Auth working** — email/password signup and Google OAuth, role selection (client vs photographer)
3. **Photographer onboarding flow** — a logged-in user can apply to be listed as a photographer, fill out their profile, and submit for approval
4. **Public photographer profile page** at `/photographer/[slug]` — visible without login, shows portfolio, bio, specialties, links, contact info
5. **Basic nav shell** — header with logo, login/signup, messages icon placeholder, saved icon placeholder

That's it. No search, no messaging, no admin yet. Just: a photographer can create a profile and it has a real public URL someone can visit.

---

## Database Schema

### `profiles` (extends Supabase auth.users)
```sql
id              uuid references auth.users primary key
full_name       text
avatar_url      text
location        text
is_photographer boolean default false
is_approved     boolean default false  -- admin must approve before profile goes live
created_at      timestamptz default now()
```

### `photographer_profiles`
```sql
id              uuid primary key default gen_random_uuid()
user_id         uuid references profiles(id) unique
slug            text unique not null  -- used in /photographer/[slug]
bio             text
primary_specialty   text not null
secondary_specialty_1  text
secondary_specialty_2  text
service_area    text
price_range_min integer  -- in dollars
price_range_max integer
instagram_url   text
website_url     text
other_link_url  text
other_link_label text
public_email    text
public_phone    text
available_this_month  boolean default true
created_at      timestamptz default now()
updated_at      timestamptz default now()
```

### `portfolio_items`
```sql
id              uuid primary key default gen_random_uuid()
photographer_id uuid references photographer_profiles(id) on delete cascade
storage_path    text not null  -- path in Supabase Storage
type            text check (type in ('photo', 'video'))
display_order   integer default 0
created_at      timestamptz default now()
```
Cap enforcement: max 30 photos, 5 videos — enforce in app logic, not DB constraint.

### `specialties` (reference table for filter options)
```sql
id    uuid primary key default gen_random_uuid()
name  text unique not null
slug  text unique not null
```
Seed with: Wedding, Family, Engagement, Newborn, Senior/Graduation, Headshots, Sports/Action, Real Estate, Events, Videography/Cinematography

---

## RLS Policies (Supabase)

- **profiles**: users can read all, update only their own
- **photographer_profiles**: anyone can read approved ones (`is_approved = true` on joined profile), owner can update their own
- **portfolio_items**: anyone can read, owner can insert/delete
- **specialties**: public read-only

---

## Page 1 of Session 1: Auth (`/login`, `/signup`)

### Signup flow
1. Enter name, email, password
2. OR "Continue with Google"
3. Choose role: **"I'm looking for a photographer"** vs **"I'm a photographer"**
   - Client → goes to home dashboard (placeholder for now)
   - Photographer → goes to `/onboarding` flow
4. Store role choice in `profiles.is_photographer`

### Design notes
- Keep it minimal — one column, centered card
- No email verification gate in v1 (adds friction, slows testing)

---

## Page 2 of Session 1: Photographer Onboarding (`/onboarding`)

Multi-step form. Don't try to do it all on one page — break into steps so it feels manageable. Suggested steps:

**Step 1 — The basics**
- Full name (pre-filled from auth)
- Profile photo upload
- Short bio (max 300 chars, show counter)
- Service area (text field, e.g. "Utah County & Salt Lake County")

**Step 2 — Your specialty**
- Primary specialty (required, single select from specialties table)
- Secondary specialties (optional, up to 2, multi-select excluding primary)
- Starting price range (min/max $ inputs, optional)
- Availability toggle: "Available this month" yes/no

**Step 3 — Your portfolio**
- Upload up to 30 photos (enforce limit)
- Upload up to 5 videos (enforce limit)
- Drag to reorder (display_order field)
- Store in Supabase Storage at `portfolios/{user_id}/`

**Step 4 — Links & contact**
- Instagram URL (optional)
- Personal website URL (optional)
- One additional link with custom label (optional)
- Public email (optional, shown on profile)
- Public phone (optional, shown on profile)
- Note: "These are shown publicly on your profile"

**Step 5 — Review & submit**
- Summary of everything entered
- "Submit for approval" button
- Sets `is_photographer = true` on profiles
- Creates photographer_profiles record
- Shows confirmation: "Your profile is under review. We'll notify you by email when it goes live (usually within 24 hours)."
- Slug: auto-generate from full name + random 4-digit suffix (e.g. `sarah-johnson-4821`), ensure uniqueness

---

## Page 3 of Session 1: Public Profile (`/photographer/[slug]`)

This is the most important page in the app. A client will land here and decide whether to reach out. It needs to feel clean, professional, and load fast.

### Layout (mobile-first)
```
[Cover photo / first portfolio image as hero — full width]

[Avatar] [Name]         [Specialty badge]
[Location]  [Price range]  [Availability chip: "Available this month" or "Limited availability"]

[Bio paragraph]

[Contact section]
  - "Send a Message" button (→ /messages/[photographer_id], placeholder for now — just show toast "Messaging coming soon")
  - Public email link (if set)
  - Public phone link (if set)

[Links row]
  - Instagram icon link
  - Website icon link
  - Other link (with label)

[Portfolio grid]
  - Masonry or 3-col grid
  - Photos first, then videos
  - Lightbox on click for photos
  - Videos play inline

[Specialties section]
  - Primary tag (prominent)
  - Secondary tags

[Reviews section]
  - Hide entirely if no reviews exist yet (not an empty state, just omit)
```

### SEO
- `<title>`: `{name} — {primary_specialty} Photographer in {service_area} | Foto`
- `<meta description>`: auto-generated from bio
- OG image: first portfolio photo

---

## File Structure

```
/app
  /(auth)
    /login/page.tsx
    /signup/page.tsx
  /(main)
    /onboarding/page.tsx
    /photographer/[slug]/page.tsx
  /layout.tsx
/components
  /ui/           (shadcn or custom primitives)
  /photographer/ (profile-specific components)
  /auth/         (auth form components)
/lib
  /supabase/
    client.ts
    server.ts
    middleware.ts
  /types/
    database.ts  (generated from Supabase)
/supabase
  /migrations/
    001_initial_schema.sql
```

---

## What's Explicitly Out of Scope for Session 1

- Search / filter page
- Messaging (show "coming soon" toast on message button click)
- Admin panel
- Billing / Stripe
- Reviews
- Email notifications (Resend setup can come session 2)
- Saved photographers
- Any client-facing home dashboard beyond a placeholder

---

## Definition of Done for Session 1

- [ ] Schema migration runs clean on a fresh Supabase project
- [ ] Can sign up as a photographer via email or Google
- [ ] Can complete the full onboarding flow and submit profile
- [ ] Public profile page renders at `/photographer/[slug]` with real data
- [ ] Portfolio images load from Supabase Storage
- [ ] Page looks good on mobile (375px) and desktop
- [ ] RLS policies prevent unauthorized edits
- [ ] Code is committed, Vercel preview URL works

---

## Notes for Claude Code

- Use `next/image` for all images — photographer portfolio photos especially need lazy loading
- Supabase SSR client for all server components, browser client only in client components
- Keep the onboarding form state in a single React context so steps share data without prop drilling
- Don't build a custom design system — use Tailwind utility classes directly, keep it simple
- If you need a component library, shadcn/ui is the preference
- Slug generation: `{first-name}-{last-name}-{4-digit-random}`, lowercase, hyphens, strip special chars
- Don't add Stripe, Resend, or any payment/email dependency yet — that's session 2+
