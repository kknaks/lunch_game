import type { DailyGame } from "@/lib/types";

export const todayGame: DailyGame = {
  id: "mock-daily-yut-001",
  playDate: "2026-07-14",
  gameType: "yut_gauge",
  title: "오늘의 윷놀이",
  cutoffAt: "2026-07-14T03:30:00.000Z",
  cutoffLabel: "12:30",
  status: "open",
};

export const mockLeaderboard = [
  { name: "나", resultLabel: "-", rankValue: 0 },
];
