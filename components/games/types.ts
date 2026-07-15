import type { ComponentType } from "react";
import type { GameResult, GameType } from "@/lib/types";

export type GamePlayProps = {
  savedResult: GameResult | null;
  cutoffPassed: boolean;
  onFinish: (result: GameResult) => void;
};

export type GameDefinition = {
  type: GameType;
  defaultTitle: string;
  introHeadline: string;
  introDescription: string;
  resultCaption: (result: GameResult) => string;
  Play: ComponentType<GamePlayProps>;
};
