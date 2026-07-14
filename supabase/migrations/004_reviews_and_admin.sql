-- Foto: reviews + admin dashboard (Session 4)

-- ============================================================
-- reviews
-- ============================================================
create table public.reviews (
  id              uuid primary key default gen_random_uuid(),
  photographer_id uuid references public.photographer_profiles(id) on delete cascade not null,
  reviewer_id     uuid references public.profiles(id) on delete cascade not null,
  rating          integer not null check (rating between 1 and 5),
  content         text not null check (char_length(content) between 20 and 1000),
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null,
  unique (photographer_id, reviewer_id)
);

alter table public.reviews enable row level security;

create policy "reviews are viewable by everyone"
  on public.reviews for select
  using (true);

create policy "logged in users can leave a review"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

create policy "users can update their own review"
  on public.reviews for update
  using (auth.uid() = reviewer_id);

create policy "users can delete their own review"
  on public.reviews for delete
  using (auth.uid() = reviewer_id);

create trigger set_reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- ============================================================
-- profiles: admin + suspension flag
-- ============================================================
alter table public.profiles
  add column is_admin boolean default false not null,
  add column is_suspended boolean default false not null;

-- ============================================================
-- photographer_profiles: rejection + suspension tracking
-- ============================================================
alter table public.photographer_profiles
  add column rejected_at timestamptz,
  add column rejection_reason text,
  add column suspended_at timestamptz;

-- Admins need to preview a photographer's profile via the normal public
-- route before it's approved.
create policy "admins can view all photographer profiles"
  on public.photographer_profiles for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- ============================================================
-- reports
-- ============================================================
create table public.reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid references public.profiles(id) on delete set null,
  photographer_id uuid references public.photographer_profiles(id) on delete cascade not null,
  reason          text not null,
  details         text,
  resolved_at     timestamptz,
  created_at      timestamptz default now() not null
);

alter table public.reports enable row level security;

-- Reporting doesn't require login (brief: anonymous reports are fine).
-- No select policy for regular users — only the service-role admin client
-- reads this table.
create policy "anyone can submit a report"
  on public.reports for insert
  with check (true);
