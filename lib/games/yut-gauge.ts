export type YutLabel = "도" | "개" | "걸" | "윷" | "모";
export type AccuracyBand = "perfect" | "great" | "good" | "normal" | "bad";

export type ProbabilityRow = {
  band: AccuracyBand;
  minError: number;
  maxError: number;
  weights: Record<YutLabel, number>;
};

export type YutGaugeResult = {
  resultLabel: YutLabel;
  rankValue: number;
  score: number;
  metadata: {
    gameType: "yut_gauge";
    accuracyBand: AccuracyBand;
    centerErrorRatio: number;
    gaugePosition: number;
    probabilityTableVersion: "yut-gauge-v1";
  };
};

const rankByLabel: Record<YutLabel, number> = {
  "도": 1,
  "개": 2,
  "걸": 3,
  "윷": 4,
  "모": 5,
};

export const probabilityTable: ProbabilityRow[] = [
  {
    band: "perfect",
    minError: 0,
    maxError: 0.05,
    weights: { "도": 5, "개": 8, "걸": 18, "윷": 31, "모": 38 },
  },
  {
    band: "great",
    minError: 0.05,
    maxError: 0.15,
    weights: { "도": 8, "개": 12, "걸": 24, "윷": 30, "모": 26 },
  },
  {
    band: "good",
    minError: 0.15,
    maxError: 0.3,
    weights: { "도": 14, "개": 18, "걸": 30, "윷": 24, "모": 14 },
  },
  {
    band: "normal",
    minError: 0.3,
    maxError: 0.5,
    weights: { "도": 24, "개": 24, "걸": 28, "윷": 16, "모": 8 },
  },
  {
    band: "bad",
    minError: 0.5,
    maxError: 1.000001,
    weights: { "도": 38, "개": 28, "걸": 21, "윷": 9, "모": 4 },
  },
];

export function getCenterErrorRatio(gaugePosition: number) {
  return Math.min(1, Math.max(0, Math.abs(gaugePosition - 0.5) * 2));
}

export function getAccuracyBand(centerErrorRatio: number) {
  return (
    probabilityTable.find(
      (row) =>
        centerErrorRatio >= row.minError && centerErrorRatio < row.maxError,
    ) ?? probabilityTable[probabilityTable.length - 1]
  );
}

export function drawYutResult(
  gaugePosition: number,
  randomValue = Math.random(),
): YutGaugeResult {
  const centerErrorRatio = getCenterErrorRatio(gaugePosition);
  const probability = getAccuracyBand(centerErrorRatio);
  const roll = Math.min(99.999999, Math.max(0, randomValue * 100));
  let cursor = 0;
  let resultLabel: YutLabel = "도";

  for (const label of Object.keys(probability.weights) as YutLabel[]) {
    cursor += probability.weights[label];
    if (roll < cursor) {
      resultLabel = label;
      break;
    }
  }

  const rankValue = rankByLabel[resultLabel];

  return {
    resultLabel,
    rankValue,
    score: rankValue,
    metadata: {
      gameType: "yut_gauge",
      accuracyBand: probability.band,
      centerErrorRatio,
      gaugePosition,
      probabilityTableVersion: "yut-gauge-v1",
    },
  };
}
