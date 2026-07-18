-- 기존 DB에 archery 게임 타입을 허용하도록 check 제약을 교체합니다.
alter table public.daily_games
  drop constraint if exists daily_games_game_type_check;

alter table public.daily_games
  add constraint daily_games_game_type_check
  check (game_type in ('yut_gauge', 'card_draw', 'archery'));
