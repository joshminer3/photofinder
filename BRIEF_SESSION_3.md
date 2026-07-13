# Foto — Development Brief
## Session 3: Messaging, Saved Photographers & Profile Edit

---

## Context

Session 1: Auth, photographer onboarding, public profile page
Session 2: Admin approval, transactional email, search + filters

Session 3 completes the core product loop. After this session:
- A client can save a photographer they like
- A client can message a photographer directly from their profile
- A photographer can read and reply to inquiries
- Both sides get email notifications on new messages
- A photographer can edit their profile after it's live

This is the session where the product becomes real. A photographer can receive an actual lead. Build messaging carefully — it's the most trust-critical feature in the entire app.

---

## No New Dependencies

Everything this session uses is already in the stack. No new packages unless absolutely unavoidable.

Supabase Realtime can handle live message updates — it's already available, no extra setup needed.

---

## Part 1: Saved Photographers

Small feature, build it first since it's the quickest win and touches the profile page from session 1.

### Schema addition

```sql
create table saved_photographers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade,
  photographer_id uuid references photographer_profiles(id) on delete cascade,
  created_at      timestamptz default now(),
  unique(user_id, photographer_id)  -- prevent duplicate saves
);
```

RLS:
- Users can read, insert, delete their own rows only
- No one else can see another user's saved list

### UI touchpoints

**On the public profile page (`/photographer/[slug]`):**
- "Save" button (bookmark icon) in the header area
- If user is not logged in → clicking redirects to `/login?redirect=/photographer/{slug}`
- If logged in → toggles saved state, updates instantly (optimistic UI)
- Button state: filled icon = saved, outline = not saved

**Saved photographers page (`/saved`):**
- Grid of photographer cards (same card component from search results)
- Empty state: "No saved photographers yet. Browse photographers and save the ones you like."
- Link in main nav (bookmark icon, same as messages icon)

### API

Use Supabase client directly — no API route needed:
- `insert into saved_photographers` on save
- `delete from saved_photographers where user_id = ? and photographer_id = ?` on unsave
- Check saved state on profile page load by querying for existing row

---

## Part 2: Messaging

This is the core of session 3. Build it carefully and test every edge case — a message that silently fails to deliver is the worst possible outcome for the product's core promise.

### Schema

```sql
create table conversations (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid references profiles(id) on delete cascade,
  photographer_id   uuid references photographer_profiles(id) on delete cascade,
  created_at        timestamptz default now(),
  unique(client_id, photographer_id)  -- one conversation per pair
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id       uuid references profiles(id) on delete cascade,
  content         text not null check (char_length(content) <= 2000),
  read_at         timestamptz,  -- null = unread
  created_at      timestamptz default now()
);

-- Index for fast conversation message loading
create index messages_conversation_id_created_at 
  on messages(conversation_id, created_at asc);
```

RLS:
- Conversations: readable only by the client or photographer in that conversation
- Messages: readable only by participants in the parent conversation
- Messages: insertable only if the sender_id matches the authenticated user AND they are a participant in the conversation

### Conversation creation flow

When a client clicks "Send a Message" on a photographer's profile:

1. Check if a conversation already exists between this client and photographer
2. If yes → redirect to existing conversation at `/messages/{conversation_id}`
3. If no → create new conversation record, then redirect to `/messages/{conversation_id}`

Don't let a client start multiple conversations with the same photographer — one thread per pair keeps things clean and prevents photographer inbox fragmentation.

If the client is not logged in → redirect to `/login?redirect=/photographer/{slug}` (same as save button).

### Messages page layout (`/messages`)

**Left panel — conversation list:**
```
[Avatar] [Photographer name]
[Last message preview — truncated 60 chars]    [Timestamp]
[Unread indicator dot if read_at is null]
```
- Shows all conversations for the current user (whether they're a client or photographer)
- Sorted by most recent message first
- Clicking a conversation loads it in the right panel

**Right panel — conversation thread:**
```
[Photographer name + avatar header]
[Message bubbles — sender right, receiver left]
[Timestamp on each message]
[Text input + Send button at bottom]
```

**Mobile:** Full screen conversation list, tap to open full screen thread, back button to return to list. Don't try to do a split panel on mobile.

**Empty state (no conversations yet):**
```
"No messages yet.
Find a photographer you love and send them a message."
[Browse Photographers button]
```

### Message sending

- Text input, max 2000 chars, show character counter when over 1500
- Send on button click OR Ctrl+Enter / Cmd+Enter
- Optimistic UI: message appears immediately in thread, syncs to DB in background
- If send fails: show inline error "Message failed to send. Try again." with retry option — never silently drop a message
- Mark messages as read (`read_at = now()`) when the conversation is opened and the user is the recipient

### Realtime updates

Use Supabase Realtime to subscribe to new messages in the active conversation:

```typescript
supabase
  .channel(`conversation:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    // append new message to thread
  })
  .subscribe()
```

Clean up the subscription on component unmount. This gives the feel of a real-time chat without polling.

### Email notifications on new message

When a message is inserted, fire an email to the recipient. Use the existing Resend utility from session 2.

Handle this in a Supabase Database Webhook or in the API route that handles message sending — whichever is simpler to implement. API route approach is more straightforward:

**`POST /api/messages/send`**
- Authenticated route (verify session server-side)
- Inserts message into DB
- Looks up recipient's email
- Fires notification email via Resend
- Returns the created message

Don't fire the email if the recipient has their tab open and is actively in the conversation — check `read_at` after a short delay (3 seconds), only send email if still unread. Simple approximation: just always send the email for v1, the slight over-notification is fine at low volume.

### Email template: new message notification

**To:** recipient (photographer or client)
**Subject:** `New message from {sender_name} on Foto`

```
{sender_name} sent you a message:

"{message_preview — first 200 chars}"

Reply on Foto:
{APP_URL}/messages/{conversation_id}

— Foto
```

### Photographer inbox (`/messages` when logged in as photographer)

Same `/messages` page — the conversation list component works for both sides. The only difference is context: a photographer sees conversations initiated by clients, a client sees conversations they started.

No special photographer-only inbox UI needed — the shared messages page handles both.

---

## Part 3: Photographer Profile Edit (`/dashboard/profile`)

Photographers need to be able to update their profile after it goes live — new portfolio photos, price changes, availability toggle, etc.

### Route

`/dashboard/profile` — protected, only accessible if `is_photographer = true`

This is also the start of a "photographer dashboard" that will grow in later sessions (analytics, reviews, billing). Set up the route structure to support that even if only the profile edit page exists now:

```
/dashboard/
  profile/page.tsx      -- this session
  (future: analytics, billing, reviews)
layout.tsx              -- dashboard shell with sidebar nav
```

### Dashboard layout shell

Simple sidebar (or top tabs on mobile):
```
[Foto logo]
Profile          ← active this session
Analytics        ← coming soon (greyed out)
Billing          ← coming soon (greyed out)
Reviews          ← coming soon (greyed out)
[View my profile →]  link to /photographer/[slug]
```

Greyed-out nav items are fine — they signal what's coming without being dead ends. Don't build placeholder pages for them, just disabled nav links.

### Profile edit page

Pre-populate all fields from the existing `photographer_profiles` record. Same fields as onboarding but in a single-page edit form rather than multi-step (they've already been through the steps once):

**Section 1 — Basics**
- Profile photo (upload new or keep existing)
- Full name
- Bio (300 char limit, show counter)
- Service area

**Section 2 — Specialty & Pricing**
- Primary specialty (single select)
- Secondary specialties (up to 2)
- Price range min/max
- Availability toggle: "Available this month"

**Section 3 — Portfolio**
- Current photos in a grid with delete (×) button on each
- "Add photos" upload button (respects 30 photo cap)
- Current videos with delete button
- "Add videos" upload button (respects 5 video cap)
- Show current counts: "24/30 photos, 2/5 videos"

**Section 4 — Links & Contact**
- Instagram URL
- Website URL
- Other link (URL + label)
- Public email
- Public phone

**Save button** — single save for the whole form. On success: "Profile updated." toast. On error: "Something went wrong. Try again." toast.

### Re-approval on edit?

No. Edits go live immediately without re-review. The initial approval was the trust gate — you're not going to manually re-review every portfolio update. If abuse becomes a problem later, add a content flagging system. Don't gate it now.

### File handling on portfolio edit

When a photographer deletes a photo:
- Remove the `portfolio_items` record from DB
- Delete the file from Supabase Storage (`storage.remove([path])`)
- Do both or neither — don't leave orphaned storage files

When adding new photos:
- Upload to Supabase Storage at `portfolios/{user_id}/{filename}`
- Insert new `portfolio_items` record
- Append to end of display order

---

## Full Route Map After Session 3

```
/                         Home with search entry
/search                   Search + filter results
/photographer/[slug]      Public profile (client view)
/login                    Auth
/signup                   Auth
/onboarding               Photographer onboarding (multi-step)
/saved                    Client's saved photographers   ← new
/messages                 Conversation list              ← new
/messages/[id]            Single conversation thread     ← new
/dashboard/profile        Photographer profile edit      ← new
/api/admin/approve        Admin approval endpoint
/api/messages/send        Send message + trigger email   ← new
```

---

## Definition of Done for Session 3

- [ ] Client can save/unsave a photographer from their profile page
- [ ] `/saved` page shows saved photographers correctly
- [ ] Client can initiate a conversation from a photographer's profile
- [ ] Only one conversation exists per client-photographer pair
- [ ] Messages send and appear in the thread
- [ ] Realtime updates work — new messages appear without refresh
- [ ] Recipient gets an email notification on new message
- [ ] Unread indicator shows on conversation list
- [ ] Messages marked as read when conversation is opened
- [ ] `/dashboard/profile` loads with existing profile data pre-filled
- [ ] Photographer can edit all profile fields and save
- [ ] Portfolio photo/video add and delete works, storage files cleaned up
- [ ] Dashboard layout shell exists with greyed-out future nav items
- [ ] Not-logged-in users redirected to login when trying to message or save

---

## What's Still Out of Scope

- Reviews (session 4)
- Billing / Stripe (session 4)
- Admin dashboard UI (session 4)
- Push notifications (Phase 2)
- Read receipts visible to sender (Phase 2)
- Message attachments / photo sharing in chat (Phase 2)
- Lead status tagging in photographer inbox (Phase 2)

---

## Notes for Claude Code

- The `unique(client_id, photographer_id)` constraint on conversations is important — use an upsert pattern (`insert ... on conflict do nothing`) when creating conversations so a race condition doesn't create duplicates
- Realtime subscription must be cleaned up on unmount (`channel.unsubscribe()`) — missed cleanups cause duplicate message listeners and messages appearing twice
- The messages page needs to handle two contexts (client view vs photographer view) without two separate pages — the conversation list component is the same, just query by `client_id = me` OR `photographer_id = me` depending on whether the user is a photographer
- Profile edit photo uploads: generate a unique filename (`{uuid}.{ext}`) rather than using the original filename — prevents collisions and path traversal issues
- Dashboard layout shell should use a layout.tsx with a middleware check: redirect to `/` if `is_photographer = false`
- Test the RLS policies on messages thoroughly — a client should never be able to read another client's messages even if they guess a conversation ID
