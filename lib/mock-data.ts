export type DailyGame = {
  id: string;
  playDate: string;
  gameType: "yut_gauge";
  title: string;
  cutoffLabel: string;
  status: "open" | "closed";
};

export const todayGame: DailyGame = {
  id: "mock-daily-yut-001",
  playDate: "2026-07-14",
  gameType: "yut_gauge",
  title: "오늘의 윷놀이",
  cutoffLabel: "12:30",
  status: "open",
};

export const mockLeaderboard = [
  { name: "나", resultLabel: "-", rankValue: 0 },
];
