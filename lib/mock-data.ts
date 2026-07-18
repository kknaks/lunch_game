import type { DailyGame } from "@/lib/types";

export const todayGame: DailyGame = {
  id: "mock-daily-archery-001",
  playDate: "2026-07-16",
  gameType: "archery",
  title: "오늘의 양궁",
  cutoffAt: "2026-07-16T14:59:00.000Z",
  cutoffLabel: "23:59",
  status: "open",
};

export const mockLeaderboard = [
  { name: "나", resultLabel: "-", rankValue: 0 },
];
