import type { DailyGame } from "@/lib/types";

export const todayGame: DailyGame = {
  id: "mock-daily-card-001",
  playDate: "2026-07-15",
  gameType: "card_draw",
  title: "오늘의 카드뽑기",
  cutoffAt: "2026-07-15T14:59:00.000Z",
  cutoffLabel: "23:59",
  status: "open",
};

export const mockLeaderboard = [
  { name: "나", resultLabel: "-", rankValue: 0 },
];
