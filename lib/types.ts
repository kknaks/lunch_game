import type { YutGaugeResult } from "@/lib/games/yut-gauge";

export type DailyGame = {
  id: string;
  playDate: string;
  gameType: "yut_gauge";
  title: string;
  cutoffAt: string;
  cutoffLabel: string;
  status: "open" | "closed";
};

export type LeaderboardRow = {
  name: string;
  resultLabel: string;
  rankValue: number;
};

export type GameResultPayload = {
  gameId: string;
  score: number;
  rankValue: number;
  resultLabel: YutGaugeResult["resultLabel"];
  metadata: YutGaugeResult["metadata"];
};
