insert into public.daily_games (play_date, game_type, title, cutoff_at, config)
values (
  (now() at time zone 'Asia/Seoul')::date,
  'yut_gauge',
  '오늘의 윷놀이',
  (((now() at time zone 'Asia/Seoul')::date)::text || ' 12:30:00+09')::timestamptz,
  '{}'::jsonb
)
on conflict (play_date) do update
set game_type = excluded.game_type,
    title = excluded.title,
    cutoff_at = excluded.cutoff_at,
    config = excluded.config,
    status = 'open';
