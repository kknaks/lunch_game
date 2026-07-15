create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  source_user_id uuid unique,
  department text,
  position text,
  role text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_games (
  id uuid primary key default gen_random_uuid(),
  play_date date not null unique,
  game_type text not null check (game_type in ('yut_gauge', 'card_draw')),
  title text not null,
  cutoff_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.daily_games(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null,
  rank_value integer not null,
  result_label text not null,
  metadata jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  unique (game_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.daily_games enable row level security;
alter table public.game_results enable row level security;

drop policy if exists "profiles readable by authenticated" on public.profiles;
drop policy if exists "daily games readable by authenticated" on public.daily_games;
drop policy if exists "results readable by participants" on public.game_results;
drop policy if exists "users insert own result before cutoff" on public.game_results;

create or replace function public.has_submitted_result(target_game_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.game_results gr
    where gr.game_id = target_game_id
      and gr.user_id = auth.uid()
  );
$$;

grant execute on function public.has_submitted_result(uuid) to authenticated;

create policy "profiles readable by authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "daily games readable by authenticated"
  on public.daily_games for select
  to authenticated
  using (true);

create policy "results readable by participants"
  on public.game_results for select
  to authenticated
  using (
    public.has_submitted_result(game_id)
    or exists (
      select 1
      from public.daily_games dg
      where dg.id = game_results.game_id
        and now() >= dg.cutoff_at
    )
  );

create policy "users insert own result before cutoff"
  on public.game_results for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.daily_games dg
      where dg.id = game_id
        and now() < dg.cutoff_at
    )
  );

create or replace view public.leaderboard_results as
select
  gr.game_id,
  gr.user_id,
  p.display_name,
  p.email,
  gr.score,
  gr.rank_value,
  gr.result_label,
  gr.metadata,
  gr.submitted_at
from public.game_results gr
join public.profiles p on p.id = gr.user_id
where p.active = true;
