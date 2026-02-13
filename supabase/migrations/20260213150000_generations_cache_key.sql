-- Add cache_key to generations for response caching (same input within 24h = cache hit, no debit)
-- Per-user; index supports lookup by user_id + cache_key + created_at

begin;

alter table public.generations
  add column if not exists cache_key text;

create index if not exists idx_generations_user_cache_created
  on public.generations (user_id, cache_key, created_at desc)
  where cache_key is not null;

comment on column public.generations.cache_key is 'sha256(channel,vibe,normalized_input) for cache lookup';

commit;
