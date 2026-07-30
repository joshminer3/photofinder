-- Foto: allow photographers to add more than the fixed Instagram/Website/Other
-- link slots, via an open-ended list of {label, url} pairs.

alter table public.photographer_profiles
  add column additional_links jsonb not null default '[]'::jsonb;
