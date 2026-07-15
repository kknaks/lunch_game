export type CardSuit = "spade" | "diamond" | "heart" | "club";

export type CardDrawResult = {
  resultLabel: string;
  rankValue: number;
  score: number;
  metadata: {
    gameType: "card_draw";
    suit: CardSuit;
    value: string;
    cardIndex: number;
    deckVersion: "card-draw-v1";
  };
};

// 낮은 순 → 높은 순. 같은 숫자면 무늬 서열(♣ < ♥ < ♦ < ♠)로 순위 결정
export const suitOrder: CardSuit[] = ["club", "heart", "diamond", "spade"];

export const suitSymbols: Record<CardSuit, string> = {
  spade: "♠",
  diamond: "♦",
  heart: "♥",
  club: "♣",
};

// 낮은 순 → 높은 순 (A가 가장 높음)
export const cardValues = [
  "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A",
];

export const deckSize = suitOrder.length * cardValues.length;

export function isRedSuit(suit: CardSuit) {
  return suit === "heart" || suit === "diamond";
}

export function drawCard(randomValue = Math.random()): CardDrawResult {
  const cardIndex = Math.min(
    deckSize - 1,
    Math.max(0, Math.floor(randomValue * deckSize)),
  );
  const valueIndex = Math.floor(cardIndex / suitOrder.length);
  const suitIndex = cardIndex % suitOrder.length;
  const suit = suitOrder[suitIndex];
  const value = cardValues[valueIndex];
  const rankValue = cardIndex + 1;

  return {
    resultLabel: `${suitSymbols[suit]}${value}`,
    rankValue,
    score: rankValue,
    metadata: {
      gameType: "card_draw",
      suit,
      value,
      cardIndex,
      deckVersion: "card-draw-v1",
    },
  };
}
