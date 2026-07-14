import { todayGame } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase/client";
import type { DailyGame, GameResultPayload, LeaderboardRow } from "@/lib/types";

type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

type DbDailyGame = {
  id: string;
  play_date: string;
  game_type: "yut_gauge";
  title: string;
  cutoff_at: string;
  status: "open" | "closed";
};

type DbGameResult = {
  score: number;
  rank_value: number;
  result_label: string;
  user_id: string;
  metadata: GameResultPayload["metadata"];
  display_name: string | null;
  email: string | null;
};

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) {
    return {
      id: "mock-user",
      email,
      displayName: email.split("@")[0] || "나",
    } satisfies AuthUser;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user?.email) throw new Error("로그인 사용자 정보를 찾을 수 없습니다.");

  return {
    id: data.user.id,
    email: data.user.email,
    displayName:
      (data.user.user_metadata.display_name as string | undefined) ??
      data.user.email.split("@")[0],
  } satisfies AuthUser;
}

export async function getCurrentUser() {
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user?.email) return null;

  return {
    id: user.id,
    email: user.email,
    displayName:
      (user.user_metadata.display_name as string | undefined) ??
      user.email.split("@")[0],
  } satisfies AuthUser;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function changePassword(password: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function getTodayGame(): Promise<DailyGame> {
  if (!supabase) return todayGame;

  const todayKst = getKstDateString();
  const { data, error } = await supabase
    .from("daily_games")
    .select("id, play_date, game_type, title, cutoff_at, status")
    .eq("play_date", todayKst)
    .eq("status", "open")
    .single<DbDailyGame>();

  if (error) throw error;

  return {
    id: data.id,
    playDate: data.play_date,
    gameType: data.game_type,
    title: data.title,
    cutoffAt: data.cutoff_at,
    cutoffLabel: formatKstTime(data.cutoff_at),
    status: data.status,
  };
}

export async function getMyTodayResult(gameId: string) {
  if (!supabase) return null;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from("game_results")
    .select("score, rank_value, result_label, metadata")
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    score: data.score,
    rankValue: data.rank_value,
    resultLabel: data.result_label,
    metadata: data.metadata,
  };
}

export async function submitGameResult(payload: GameResultPayload) {
  if (!supabase) return;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("로그인이 필요합니다.");

  const { error } = await supabase.from("game_results").insert({
    game_id: payload.gameId,
    user_id: user.id,
    score: payload.score,
    rank_value: payload.rankValue,
    result_label: payload.resultLabel,
    metadata: payload.metadata,
  });

  if (error) throw error;
}

export async function getLeaderboard(gameId: string): Promise<LeaderboardRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("leaderboard_results")
    .select("score, rank_value, result_label, user_id, metadata, display_name, email")
    .eq("game_id", gameId)
    .returns<DbGameResult[]>();

  if (error) throw error;

  return data.map((row) => ({
    name:
      row.display_name ??
      row.email?.split("@")[0] ??
      row.user_id.slice(0, 8),
    resultLabel: row.result_label,
    rankValue: row.rank_value,
  }));
}

export function canReadLeaderboard(cutoffAt: string, hasResult: boolean) {
  return hasResult || isPastCutoff(cutoffAt);
}

function getKstDateString() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

function formatKstTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function isPastCutoff(cutoffAt: string) {
  return Date.now() >= new Date(cutoffAt).getTime();
}
