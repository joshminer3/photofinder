# Foto

hhtps://foto.dog

Photographer discovery marketplace for Utah. See [BRIEF.md](./BRIEF.md) for
the full product spec.

## Stack

Next.js (App Router) · TypeScript · Supabase (Postgres, Auth, Storage) ·
Tailwind CSS · shadcn/ui (Base UI primitives)

## Getting started

1. Copy `.env.local.example` to `.env.local` and fill in your Supabase
   project's URL and anon key (Project Settings → API).
2. Install dependencies and apply the schema:
   ```bash
   npm install
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
3. In the Supabase dashboard, under Authentication → Sign In / Up → Email,
   turn off "Confirm email" (v1 has no email-verification gate — see BRIEF.md).
4. Run the dev server:
   ```bash
   npm run dev
   ```

## Project structure

- `app/(auth)` — login/signup
- `app/(main)` — home, onboarding, public photographer profiles
- `components/` — UI primitives (`ui/`), and feature components grouped by
  domain (`auth/`, `onboarding/`, `photographer/`)
- `lib/supabase/` — browser/server/proxy Supabase clients
- `lib/types/database.ts` — generated from the live schema via
  `supabase gen types typescript`
- `supabase/migrations/` — SQL schema migrations

## Notes

- This shadcn/ui setup is built on **Base UI**, not Radix — polymorphic
  components use a `render` prop (e.g. `<Button render={<Link href="/x" />} />`),
  not `asChild`.
- `next.config.ts` sets `images.contentDispositionType: "inline"` because
  Next's default (`"attachment"`) makes Chrome refuse to render optimized
  images inline. This is paired with a storage bucket MIME-type restriction
  (`supabase/migrations/002_...sql`) so only real image/video files can be
  uploaded and served.
