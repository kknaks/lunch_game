-- 게임 풀에 등록된 순서(idx)대로 하루에 1개씩 돌아가며 오늘의 게임을 만듭니다.
-- 새 게임을 만들면 아래 values에 다음 idx로 한 줄 추가하면 됩니다.
-- (게임이 충분히 모이면 이 부분을 random 선택으로 바꿀 예정)
-- 이미 오늘 게임이 있으면 그대로 둡니다 (재실행해도 게임이 바뀌지 않음).
with game_pool as (
  select *
  from (values
    (0, 'yut_gauge', '오늘의 윷놀이'),
    (1, 'card_draw', '오늘의 카드뽑기')
  ) as t(idx, game_type, title)
),
picked as (
  select game_type, title
  from game_pool
  where idx = (
    -- 기준일: 2026-07-15 = idx 0(yut_gauge) → 2026-07-16 = idx 1(card_draw)
    ((now() at time zone 'Asia/Seoul')::date - date '2026-07-15')
    % (select count(*) from game_pool)
  )
)
insert into public.daily_games (play_date, game_type, title, cutoff_at, config)
select
  (now() at time zone 'Asia/Seoul')::date,
  picked.game_type,
  picked.title,
  (((now() at time zone 'Asia/Seoul')::date)::text || ' 12:30:00+09')::timestamptz,
  '{}'::jsonb
from picked
on conflict (play_date) do nothing;
