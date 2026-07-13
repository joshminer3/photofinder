-- Foto: initial schema (Session 1)

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id              uuid references auth.users on delete cascade primary key,
  full_name       text,
  avatar_url      text,
  location        text,
  is_photographer boolean default false not null,
  is_approved     boolean default false not null,
  created_at      timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profiles row whenever a new auth.users row is created.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- specialties
-- ============================================================
create table public.specialties (
  id    uuid primary key default gen_random_uuid(),
  name  text unique not null,
  slug  text unique not null
);

alter table public.specialties enable row level security;

create policy "specialties are viewable by everyone"
  on public.specialties for select
  using (true);

insert into public.specialties (name, slug) values
  ('Wedding', 'wedding'),
  ('Family', 'family'),
  ('Engagement', 'engagement'),
  ('Newborn', 'newborn'),
  ('Senior/Graduation', 'senior-graduation'),
  ('Headshots', 'headshots'),
  ('Sports/Action', 'sports-action'),
  ('Real Estate', 'real-estate'),
  ('Events', 'events'),
  ('Videography/Cinematography', 'videography-cinematography');

-- ============================================================
-- photographer_profiles
-- ============================================================
create table public.photographer_profiles (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references public.profiles(id) on delete cascade unique not null,
  slug                   text unique not null,
  bio                    text,
  primary_specialty      text not null,
  secondary_specialty_1  text,
  secondary_specialty_2  text,
  service_area           text,
  price_range_min        integer,
  price_range_max        integer,
  instagram_url          text,
  website_url            text,
  other_link_url         text,
  other_link_label       text,
  public_email           text,
  public_phone           text,
  available_this_month   boolean default true not null,
  created_at             timestamptz default now() not null,
  updated_at             timestamptz default now() not null
);

alter table public.photographer_profiles enable row level security;

create policy "approved photographer profiles are viewable by everyone"
  on public.photographer_profiles for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = photographer_profiles.user_id
        and profiles.is_approved = true
    )
  );

create policy "owners can view their own photographer profile"
  on public.photographer_profiles for select
  using (auth.uid() = user_id);

create policy "owners can insert their own photographer profile"
  on public.photographer_profiles for insert
  with check (auth.uid() = user_id);

create policy "owners can update their own photographer profile"
  on public.photographer_profiles for update
  using (auth.uid() = user_id);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_photographer_profiles_updated_at
  before update on public.photographer_profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- portfolio_items
-- ============================================================
create table public.portfolio_items (
  id              uuid primary key default gen_random_uuid(),
  photographer_id uuid references public.photographer_profiles(id) on delete cascade not null,
  storage_path    text not null,
  type            text check (type in ('photo', 'video')) not null,
  display_order   integer default 0 not null,
  created_at      timestamptz default now() not null
);

alter table public.portfolio_items enable row level security;

create policy "portfolio items are viewable by everyone"
  on public.portfolio_items for select
  using (true);

create policy "owners can insert their own portfolio items"
  on public.portfolio_items for insert
  with check (
    exists (
      select 1 from public.photographer_profiles
      where photographer_profiles.id = portfolio_items.photographer_id
        and photographer_profiles.user_id = auth.uid()
    )
  );

create policy "owners can update their own portfolio items"
  on public.portfolio_items for update
  using (
    exists (
      select 1 from public.photographer_profiles
      where photographer_profiles.id = portfolio_items.photographer_id
        and photographer_profiles.user_id = auth.uid()
    )
  );

create policy "owners can delete their own portfolio items"
  on public.portfolio_items for delete
  using (
    exists (
      select 1 from public.photographer_profiles
      where photographer_profiles.id = portfolio_items.photographer_id
        and photographer_profiles.user_id = auth.uid()
    )
  );

-- ============================================================
-- Storage: portfolios bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('portfolios', 'portfolios', true)
on conflict (id) do nothing;

create policy "portfolio files are publicly readable"
  on storage.objects for select
  using (bucket_id = 'portfolios');

create policy "users can upload to their own portfolio folder"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolios'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can update their own portfolio files"
  on storage.objects for update
  using (
    bucket_id = 'portfolios'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete their own portfolio files"
  on storage.objects for delete
  using (
    bucket_id = 'portfolios'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
