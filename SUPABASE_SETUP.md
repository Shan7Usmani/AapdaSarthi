# Supabase setup for cross-device SOS sync

Run this SQL in your Supabase project's SQL editor (Project → SQL → New query),
then paste the project URL + anon key into `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (Vercel + `.env.local`).

```sql
-- AapdaSarthi cross-device sync tables
-- RLS: anyone can read (public safety data), and we authenticate writes via
-- the Publishable/anon key. For a hackathon MVP this is acceptable; for
-- production you would switch to authenticated rows per rescue team.

create table if not exists public.sos_items (
  id text primary key,
  data jsonb not null
);

create table if not exists public.resource_requests (
  id text primary key,
  data jsonb not null
);

create table if not exists public.rescuers (
  id text primary key,
  data jsonb not null
);

alter table public.sos_items enable row level security;
alter table public.resource_requests enable row level security;
alter table public.rescuers enable row level security;

-- public read + write via anon key (MVP; tighten before production)
create policy "public read sos" on public.sos_items for select using (true);
create policy "public write sos" on public.sos_items for insert with check (true);
create policy "public update sos" on public.sos_items for update using (true);
create policy "public read req" on public.resource_requests for select using (true);
create policy "public write req" on public.resource_requests for insert with check (true);
create policy "public update req" on public.resource_requests for update using (true);
create policy "public read rescuers" on public.rescuers for select using (true);
create policy "public write rescuers" on public.rescuers for insert with check (true);
create policy "public update rescuers" on public.rescuers for update using (true);
```

Enable **Realtime** for all three tables:
1. Project → Database → Replication
2. Add `sos_items` + `resource_requests` + `rescuers` to the publication (toggle them on)
