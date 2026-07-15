import { deckSize } from "@/lib/games/card-draw";
import type { GameType } from "@/lib/types";
import { CardDrawPlay } from "./card-draw-play";
import type { GameDefinition } from "./types";
import { YutGaugePlay } from "./yut-gauge-play";

export const gameDefinitions: Record<GameType, GameDefinition> = {
  yut_gauge: {
    type: "yut_gauge",
    defaultTitle: "오늘의 윷놀이",
    introHeadline: "게이지를 보고 윷을 던지세요",
    introDescription:
      "버튼을 누르면 게이지가 멈추고 윷가락을 던집니다. 가운데에 가까울수록 좋은 결과 확률이 올라가지만, 모가 보장되지는 않습니다.",
    resultCaption: (result) =>
      `${String(result.metadata.accuracyBand ?? "").toUpperCase()} · rank ${result.rankValue}`,
    Play: YutGaugePlay,
  },
  card_draw: {
    type: "card_draw",
    defaultTitle: "오늘의 카드뽑기",
    introHeadline: "손을 떼는 순간 카드가 결정됩니다",
    introDescription:
      "버튼을 누르고 있는 동안 카드 52장을 계속 섞습니다. 손을 떼면 카드 한 장이 공개되고, 카드가 높을수록 순위가 올라갑니다. 같은 숫자끼리는 ♠ > ♦ > ♥ > ♣ 순서입니다.",
    resultCaption: (result) =>
      `${deckSize}장 중 ${deckSize - result.rankValue + 1}번째로 높은 카드`,
    Play: CardDrawPlay,
  },
};

export function getGameDefinition(type: GameType): GameDefinition {
  return gameDefinitions[type] ?? gameDefinitions.yut_gauge;
}
