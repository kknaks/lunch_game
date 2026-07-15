export type GameType = "yut_gauge" | "card_draw";

export type GameResult = {
  resultLabel: string;
  rankValue: number;
  score: number;
  metadata: { gameType: GameType } & Record<string, unknown>;
};

export type DailyGame = {
  id: string;
  playDate: string;
  gameType: GameType;
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

export type GameResultPayload = GameResult & { gameId: string };
