export type ArcheryResult = {
  resultLabel: string;
  rankValue: number;
  score: number;
  metadata: {
    gameType: "archery";
    gaugePosition: number;
    score: number;
    hitAngle: number;
    version: "archery-v1";
  };
};

// 게이지에서 만점이 되는 지점 (80%)
export const perfectPoint = 0.8;

// 만점 지점에 못 미친 쪽: 완만하게 점수가 떨어진다
// [만점 지점에서 떨어진 거리 상한, 점수]
const underBands: [number, number][] = [
  [0.015, 10],
  [0.04, 9],
  [0.07, 8],
  [0.105, 7],
  [0.145, 6],
  [0.19, 5],
  [0.24, 4],
  [0.3, 3],
  [0.37, 2],
  [Infinity, 1],
];

// 만점 지점을 지나친 쪽: 훨씬 가파르게 떨어지고,
// 끝(95.5%)까지 넘어가면 낙(0점)
const overBands: [number, number][] = [
  [0.02, 10],
  [0.035, 9],
  [0.05, 8],
  [0.065, 7],
  [0.08, 6],
  [0.095, 5],
  [0.11, 4],
  [0.125, 3],
  [0.14, 2],
  [0.155, 1],
];

export function getArcheryScore(gaugePosition: number) {
  if (gaugePosition <= perfectPoint) {
    const distance = perfectPoint - gaugePosition;
    for (const [maxDistance, score] of underBands) {
      if (distance <= maxDistance) return score;
    }
    return 1;
  }

  const distance = gaugePosition - perfectPoint;
  for (const [maxDistance, score] of overBands) {
    if (distance <= maxDistance) return score;
  }
  return 0;
}

// 만점 지점에 다가갈수록 게이지가 급격히 빨라진다 (시작 대비 최대 ~10배)
export function getGaugeSpeedMultiplier(position: number) {
  const progress = Math.min(1, Math.max(0, position / perfectPoint));
  return 0.5 + 4.5 * progress * progress * progress;
}

export function drawArcheryResult(
  gaugePosition: number,
  randomValue = Math.random(),
): ArcheryResult {
  const score = getArcheryScore(gaugePosition);

  return {
    resultLabel: score === 0 ? "낙" : `${score}점`,
    // 랭킹 로직에서 rankValue 0은 "미참여"라서 낙도 1로 올려서 저장
    rankValue: score + 1,
    score,
    metadata: {
      gameType: "archery",
      gaugePosition,
      score,
      hitAngle: Math.floor(randomValue * 360),
      version: "archery-v1",
    },
  };
}
