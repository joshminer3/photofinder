# Foto — Development Brief
## Session 2: Admin Approval, Transactional Email & Search

---

## Context

Session 1 delivered: auth, photographer onboarding, and the public profile page at `/photographer/[slug]`.

Session 2 closes the loop so a photographer can actually go live and a client can actually find them. Three focused pieces:

1. **Admin approval flow** — you (the founder) get notified when a photographer submits, can approve them with one click, profile goes public
2. **Transactional email** — two emails via Resend: one to you on submission, one to the photographer on approval
3. **Search + filter page** — the core client-facing product moment

Nothing else. Messaging is session 3.

---

## Stack Additions This Session

| Addition | Purpose |
|---|---|
| Resend | Transactional email |
| `resend` npm package | Resend SDK |

No other new dependencies. Don't add anything else.

---

## Part 1: Admin Approval Flow

### How it works

When a photographer submits their profile during onboarding, two things happen:
- Their profile is created in Supabase with `is_approved = false`
- An email fires to your admin address (hardcoded env var `ADMIN_EMAIL`)

You click "Approve" in that email → hits an API route → sets `is_approved = true` → fires approval email to photographer.

That's the entire admin flow for v1. No admin dashboard UI needed yet.

### API Routes needed

**`POST /api/admin/approve`**
- Accepts `{ photographer_id, token }` in body
- `token` is a signed secret (use a simple HMAC of the photographer_id + `ADMIN_SECRET` env var) — prevents anyone who guesses the URL from approving profiles
- Sets `profiles.is_approved = true` for that user
- Triggers "you're live" email to photographer
- Returns 200 with a simple HTML success page (this is what you see after clicking the email button)

**Supabase change needed:**
- The approve route runs with the Supabase service role key (bypasses RLS) — keep this key server-side only, never in client code

### Environment variables to add
```
ADMIN_EMAIL=your@email.com
ADMIN_SECRET=some-long-random-string
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=http://localhost:3000  (swap for real URL on Vercel)
```

---

## Part 2: Transactional Emails (Resend)

Set up Resend with two email templates. Keep them plain and functional — no heavy HTML design needed at this stage.

### Email 1: New photographer submission (to admin)

**Trigger:** Photographer completes onboarding and submits profile
**To:** `ADMIN_EMAIL`
**Subject:** `New photographer submitted: {name}`

**Body:**
```
{name} just submitted their photographer profile for review.

Specialty: {primary_specialty}
Location: {service_area}
Bio: {bio}

View their profile preview:
{APP_URL}/photographer/{slug}

Approve their profile:
{APP_URL}/api/admin/approve?photographer_id={id}&token={hmac_token}

—
Foto Admin
```

The approve link is a GET request (not POST) so it works directly from an email client — simpler than a form. On click, the API route handles the approval and returns a plain HTML "Approved! {name} has been notified." page.

### Email 2: Profile approved (to photographer)

**Trigger:** Admin clicks approve
**To:** photographer's auth email
**Subject:** `You're live on Foto 🎉`

**Body:**
```
Hey {first_name},

Your Foto profile has been approved and is now live.

View your profile:
{APP_URL}/photographer/{slug}

Share this link with clients — anyone can find and contact you through it.

As photographers join and clients start searching, you'll receive messages directly through the app. We'll email you when someone reaches out.

— Josh at Foto
```

### Email utility

Create `/lib/email/send.ts` as a thin wrapper around Resend so individual email calls stay clean:

```typescript
// Usage pattern (not the implementation):
await sendEmail({
  to: 'someone@example.com',
  subject: 'Subject here',
  html: '<p>Body here</p>',
})
```

---

## Part 3: Search + Filter Page (`/search`)

This is the core client-facing product moment. A client arrives, sets filters, and gets a list of real photographers that match. It needs to feel fast and relevant.

### URL structure

Filters live in the URL as query params so searches are shareable/bookmarkable:

```
/search?specialty=wedding&location=utah-county&price_max=3000&available=true
```

### Filter panel

Show filters prominently — either a top banner on desktop or a slide-out drawer on mobile. Filters:

**Specialty** (single select)
- Dropdown populated from `specialties` table
- Default: "Any specialty"

**Location / Service area** (text input)
- Free text for v1 — client types "Utah County" or "Salt Lake City"
- Match against `photographer_profiles.service_area` with `ilike '%{input}%'`
- Don't build autocomplete yet

**Price range** (range inputs)
- Min $ / Max $ inputs
- Match: `price_range_min <= user_max AND price_range_max >= user_min`
- Leave blank = no price filter

**Available this month** (toggle)
- When on: filter to `available_this_month = true` only
- Default: off

### Supabase query

Build a single parameterized query that applies whichever filters are set:

```sql
SELECT 
  pp.*,
  p.full_name,
  p.avatar_url,
  p.location
FROM photographer_profiles pp
JOIN profiles p ON pp.user_id = p.id
WHERE p.is_approved = true
  AND p.is_photographer = true
  -- conditionally add:
  AND pp.primary_specialty = $specialty          -- if specialty filter set
  AND pp.service_area ilike $location_pattern    -- if location filter set
  AND pp.price_range_min <= $price_max           -- if price filter set
  AND pp.price_range_max >= $price_min           -- if price filter set
  AND pp.available_this_month = true             -- if available toggle on
ORDER BY pp.created_at desc                      -- simple default sort for now
```

### Photographer card (search result)

Each result renders as a card. Required fields:

```
[Profile photo]
[Name]           [Primary specialty badge]
[Service area]   [Price range]
[Availability chip — "Available this month" or nothing]
[1-line bio — truncated at ~100 chars]
[View Profile →] button → /photographer/[slug]
```

Card links to the public profile page from session 1. No action happens on the card itself.

### Empty state

When no results match the filters:
```
"No photographers found for those filters.
Try broadening your search — remove a filter or expand your location."
```

Don't show a sad illustration or anything heavy. Just clear text.

### No-filter default state (`/search` with no params)

Show all approved photographers, most recently joined first. This is the "browse" experience for clients who aren't sure what they want yet.

### Home page search bar

The home dashboard (`/` or `/home`) should have a simple search entry point that routes to `/search` with params:
- Specialty dropdown
- Location text input
- "Find Photographers" button → `router.push('/search?specialty=...&location=...')`

Keep the home page minimal for now — search entry + maybe a tagline. The real action is on `/search`.

---

## Page / Component Structure

```
/app
  /search/
    page.tsx          -- server component, reads searchParams, runs Supabase query
    loading.tsx       -- skeleton cards while fetching
  /api/
    /admin/
      approve/
        route.ts      -- GET handler for approval link
  /(main)/
    page.tsx          -- update home page to include search entry bar

/components
  /search/
    FilterPanel.tsx   -- filter inputs, updates URL params
    PhotographerCard.tsx
    SearchResults.tsx
  /email/             -- (optional) React Email templates if you want typed templates

/lib
  /email/
    send.ts           -- Resend wrapper
    templates/
      submission.ts   -- admin notification email HTML
      approved.ts     -- photographer approval email HTML
```

---

## Definition of Done for Session 2

- [ ] Photographer submits onboarding → admin email fires with approve link
- [ ] Admin clicks approve link → `is_approved` flips to true → photographer gets "you're live" email
- [ ] Approved photographers appear in `/search` results
- [ ] All 4 filters work correctly and update the URL
- [ ] Photographer cards link correctly to `/photographer/[slug]`
- [ ] Empty state shows when no results match
- [ ] Home page has a working search entry point
- [ ] No Resend errors in local dev (test with Resend's test mode)
- [ ] Approval route is protected by HMAC token (not open to anyone)

---

## What's Still Out of Scope

- Messaging (session 3)
- Admin dashboard UI (email flow is enough until volume demands it)
- Saved photographers (small feature, tack onto session 3)
- Billing / Stripe
- Reviews
- Sort by relevance/price/distance (Phase 2)
- Location autocomplete (Phase 2)

---

## Notes for Claude Code

- The approval API route must use the **service role key**, not the anon key — RLS will block the update otherwise. Keep service role key in server-only code, never `NEXT_PUBLIC_`
- Search page should be a **server component** that reads `searchParams` directly — no client-side fetching needed, simpler and faster
- FilterPanel needs to be a **client component** (uses router, handles input state) — pass current filter values down from the server component as props
- Use `router.push` with shallow routing when filters change so the URL updates without a full page reload feeling sluggish
- Test the HMAC token logic carefully — a bug here means approve links don't work and you're stuck with unapproved profiles
- Resend has a test mode that logs emails without sending — use it in local dev so you're not spamming yourself during testing
