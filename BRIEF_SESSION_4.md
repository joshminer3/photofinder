# Foto — Development Brief
## Session 4: Reviews & Admin Dashboard

---

## Context

Session 1: Auth, photographer onboarding, public profile page
Session 2: Admin approval (email-based), transactional email, search + filters
Session 3: Messaging, saved photographers, photographer profile edit

Session 4 adds two things:
1. **Reviews** — clients can leave reviews on photographer profiles after a shoot
2. **Admin dashboard** — a real UI for you to manage photographer approvals, flag content, and see basic platform health

Billing (Stripe) is intentionally deferred until pricing and branding are finalized. Do not add any Stripe dependency this session.

---

## No New Dependencies

No new packages needed. Everything uses the existing stack.

---

## Part 1: Reviews

### Design decisions made upfront

**Who can leave a review:** Any logged-in client. No "verified booking" gate in v1 — you don't have a booking system yet, so you can't verify that a client actually hired a photographer. Accept that some reviews may be from people who didn't book, and handle abuse manually via admin tools for now.

**One review per client per photographer.** A client can edit their own review but not leave a second one.

**No anonymous reviews.** Reviewer's name is always shown. This reduces spam and builds trust.

**Reviews do not require admin approval before going live.** You'll catch abuse through the admin flagging tool built later in this session.

**Hide the reviews section entirely on a profile until at least 1 review exists.** This was decided earlier — never show an empty reviews tab.

### Schema

```sql
create table reviews (
  id               uuid primary key default gen_random_uuid(),
  photographer_id  uuid references photographer_profiles(id) on delete cascade,
  reviewer_id      uuid references profiles(id) on delete cascade,
  rating           integer not null check (rating between 1 and 5),
  content          text not null check (char_length(content) between 20 and 1000),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique(photographer_id, reviewer_id)  -- one review per client per photographer
);

-- Materialized or computed: avg rating + count per photographer
-- Don't store this — compute it fresh on profile load via:
-- select avg(rating), count(*) from reviews where photographer_id = ?
```

RLS:
- Anyone can read reviews (public)
- Logged-in users can insert a review where `reviewer_id = auth.uid()`
- Users can update/delete only their own review
- Photographers cannot review themselves (enforce in app logic: block if `reviewer.user_id = photographer.user_id`)

### Where reviews appear

**On the public profile page (`/photographer/[slug]`):**

Only render this section if the photographer has at least 1 review.

```
[Reviews section]

★★★★☆  4.3  (12 reviews)     ← aggregate rating + count

[Leave a Review button]  ← only shown to logged-in clients, hidden if they already left one

---

[Reviewer avatar] [Reviewer name]          ★★★★★
[Date]
[Review text]

[Reviewer avatar] [Reviewer name]          ★★★☆☆
[Date]
[Review text]

[Load more] if > 5 reviews, paginate in sets of 5
```

**Star display:** Use a simple CSS/SVG star component. Don't reach for a library for this.

**Aggregate rating on photographer card (search results):**
- If the photographer has reviews: show `★ 4.3 (12)` on their search card
- If no reviews yet: show nothing — don't show an empty star or "No reviews yet"

### Leave a review flow

Clicking "Leave a Review" opens a modal (not a new page):

```
[Modal]
Rate your experience with {photographer name}

★ ★ ★ ★ ★   ← interactive star selector

Your review (20–1000 characters)
[textarea]
[character count]

[Submit Review]  [Cancel]
```

On submit:
- Insert into `reviews` table
- Profile page re-fetches and shows the new review immediately
- "Leave a Review" button changes to "Edit your review" for this client

### Edit review

"Edit your review" opens the same modal pre-populated with their existing rating and text. On save, updates the existing row (`updated_at = now()`).

No delete option for clients in v1 — if someone wants a review removed they contact you directly. Keeps it simple.

### API route

**`POST /api/reviews`** — authenticated
- Validates rating (1-5) and content length (20-1000)
- Checks reviewer is not the photographer themselves
- Upserts (insert or update) the review row
- Returns the created/updated review

**`GET /api/reviews/[photographerId]`** — public
- Returns reviews + aggregate for a photographer
- Or just use Supabase client directly on the server component — no API route needed for reads

---

## Part 2: Admin Dashboard

### Why now

Session 2 gave you email-based approval — fine for the first handful of photographers. By the time session 4 is done, you'll be actively recruiting Utah photographers and the email-only flow will get unwieldy. A real admin UI makes the day-to-day manageable.

### Route

`/admin` — hard-protected. Two layers of protection:

1. Middleware check: `profiles.is_admin = true` (add this column to profiles table)
2. Hardcode your own user ID as the only admin in an env var (`ADMIN_USER_ID`) as a fallback safety check

Add `is_admin boolean default false` to the `profiles` table. Set it to true for your own account directly in Supabase Studio — no UI needed to assign admin role.

### Admin dashboard layout

Simple sidebar navigation:

```
[Foto Admin]

Pending Approval    ← badge with count
All Photographers
All Users
Flagged Content
Platform Stats
```

### Page 1: Pending Approval (`/admin/pending`)

The main daily-use page. Replaces the email approve flow.

```
[Pending Approval — 3 pending]

[Photographer card]
Name: Sarah Johnson
Submitted: 2 hours ago
Specialty: Wedding
Location: Utah County
Bio: "I've been shooting weddings for 5 years..."

[View Full Profile Preview]  [Approve]  [Reject]
```

- "View Full Profile Preview" opens their profile in a new tab at `/photographer/[slug]` — the profile is visible to admins even before approval (adjust RLS to allow this for `is_admin = true` users)
- "Approve" → sets `is_approved = true`, fires the existing "you're live" Resend email from session 2
- "Reject" → opens a small modal: "Reason for rejection (optional)" text field, then sends a rejection email, deletes or soft-deletes the profile

### Rejection email template

**Subject:** `Your Foto profile submission`

```
Hi {first_name},

Thank you for submitting your profile to Foto.

After review, we weren't able to approve your profile at this time.
{reason if provided: "Reason: {reason}"}

You're welcome to update your profile and resubmit.
If you have questions, reply to this email.

— Josh at Foto
```

Add a `rejected_at` and `rejection_reason` column to `photographer_profiles` for record-keeping:

```sql
alter table photographer_profiles 
  add column rejected_at timestamptz,
  add column rejection_reason text;
```

Rejected photographers can edit and resubmit — their profile goes back into pending state. Don't delete their account, just reset `is_approved = false` and clear `rejected_at`.

### Page 2: All Photographers (`/admin/photographers`)

Simple table of all approved photographers:

```
Name | Specialty | Location | Joined | Reviews | Messages | Actions
-----|-----------|----------|--------|---------|----------|--------
Sarah J. | Wedding | Utah Co. | Jan 5  |    3    |    12    | [View] [Suspend]
```

- Sortable by joined date (default), review count, message count
- Search by name
- "Suspend" → sets `is_approved = false`, removes from search results, sends suspension email
- Pagination: 25 per page

Message count = total messages received in their conversations. Gives you a proxy signal for which photographers are actually getting leads — useful for understanding platform health even without booking tracking.

### Page 3: All Users (`/admin/users`)

Same pattern, simpler:

```
Name | Email | Joined | Conversations | Saved | Actions
-----|-------|--------|---------------|-------|--------
```

- "Conversations" = number of photographer conversations they've started
- Actions: [View] [Suspend account]

### Page 4: Flagged Content (`/admin/flagged`)

Add a "Report this profile" link to the public photographer profile page (small, unobtrusive — in the footer of the profile). Clicking opens a simple modal:

```
Report {photographer name}'s profile

Why are you reporting this?
○ Fake or spam profile
○ Inappropriate content
○ Stolen photos
○ Other

[Optional: add details]
[Submit Report]
```

Schema:

```sql
create table reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid references profiles(id),
  photographer_id uuid references photographer_profiles(id),
  reason          text not null,
  details         text,
  resolved_at     timestamptz,
  created_at      timestamptz default now()
);
```

Admin flagged content page shows unresolved reports:

```
[!] Reported 2 hours ago by user@email.com
    Photographer: Sarah Johnson
    Reason: Stolen photos
    Details: "These photos appear on another Instagram account"

[View Profile]  [Dismiss]  [Suspend Photographer]
```

"Dismiss" marks `resolved_at = now()` — false alarm, no action.
"Suspend Photographer" suspends + marks resolved.

### Page 5: Platform Stats (`/admin/stats`)

Simple number cards — no charts needed in v1:

```
[Total Photographers]  [Pending Approval]  [Total Clients]
       47                      3                  124

[Total Conversations]  [Messages (last 7d)]  [New Signups (last 7d)]
       89                     312                    18

[Avg Rating (platform-wide)]  [Total Reviews]
          4.6                       31
```

All computed fresh from DB queries on page load. No caching needed at this volume.

---

## Full Route Map After Session 4

```
/                           Home
/search                     Search + filters
/photographer/[slug]        Public profile
/login                      Auth
/signup                     Auth
/onboarding                 Photographer onboarding
/saved                      Saved photographers
/messages                   Conversation list
/messages/[id]              Conversation thread
/dashboard/profile          Photographer profile edit
/dashboard/                 (layout shell)
/admin                      Redirect to /admin/pending
/admin/pending              Pending approvals          ← new
/admin/photographers        All photographers          ← new
/admin/users                All users                  ← new
/admin/flagged              Flagged content            ← new
/admin/stats                Platform stats             ← new
/api/reviews                POST review                ← new
/api/admin/approve          Existing email approve (keep for backwards compat)
/api/admin/reject           POST reject photographer   ← new
/api/reports                POST report a profile      ← new
```

---

## Definition of Done for Session 4

- [ ] Client can leave a review on a photographer profile (modal flow)
- [ ] Client can edit their own review
- [ ] Aggregate rating (avg + count) shows on profile and search cards
- [ ] Reviews section hidden on profiles with zero reviews
- [ ] Photographer cannot review themselves
- [ ] `/admin` routes redirect non-admins to home
- [ ] Pending approval page shows submitted profiles with approve/reject
- [ ] Approve flow works end-to-end (sets approved, fires email)
- [ ] Reject flow works end-to-end (sets rejected, fires email, photographer can resubmit)
- [ ] All photographers table with suspend action
- [ ] All users table
- [ ] Report modal on public profile page
- [ ] Flagged content page shows unresolved reports with actions
- [ ] Platform stats page shows correct counts
- [ ] `is_admin` column added to profiles, your account set to true in Supabase Studio

---

## What's Still Out of Scope

- Stripe billing (next session, once pricing/branding finalized)
- Push notifications
- Review responses from photographers (Phase 2)
- Advanced admin analytics / charts (Phase 2)
- Automated spam detection (Phase 2)
- Boosted/sponsored listings (Phase 2, after search volume exists)

---

## Notes for Claude Code

- Admin routes need protection at two levels: middleware (is_admin check on the session) AND on every Supabase query (use service role key for admin queries so RLS doesn't interfere). Never trust client-side admin checks alone.
- The star rating selector in the review modal is pure CSS/JS — resist any temptation to install a rating library for 5 stars
- Aggregate rating query: `select round(avg(rating)::numeric, 1) as avg_rating, count(*) as review_count from reviews where photographer_id = $1` — run this as part of the profile page server component fetch, not a separate client request
- Pagination on admin tables: use Supabase's `.range(from, to)` — simple offset pagination is fine at this volume
- The report modal should not require login to submit in v1 — anonymous reports are fine, the admin will judge credibility manually. Simplifies the UX for clients who aren't logged in but see a suspicious profile.
- Keep the admin UI purely functional — no need to style it beyond readable and usable. It's an internal tool only you will use.
