-- Foto: add a structured state field for search filtering (Session: state filter)
--
-- service_area stays as free text for display on the public profile;
-- state is selected from a fixed list in the UI and is what search filters on.

alter table public.photographer_profiles
  add column state text;

create index photographer_profiles_state_idx on public.photographer_profiles (state);
