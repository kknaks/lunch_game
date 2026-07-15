"use client";

import { useEffect, useState } from "react";
import {
  drawYutResult,
  probabilityTable,
  type YutGaugeResult,
  type YutLabel,
} from "@/lib/games/yut-gauge";
import type { GamePlayProps } from "./types";
import styles from "./yut-gauge-play.module.css";

type StickFace = "front" | "back";

const idleSticks: StickFace[] = ["back", "front", "back", "front"];

const sticksByLabel: Record<YutLabel, StickFace[]> = {
  "도": ["front", "back", "back", "back"],
  "개": ["front", "front", "back", "back"],
  "걸": ["front", "front", "front", "back"],
  "윷": ["front", "front", "front", "front"],
  "모": ["back", "back", "back", "back"],
};

export function YutGaugePlay({ savedResult, cutoffPassed, onFinish }: GamePlayProps) {
  const [gaugePosition, setGaugePosition] = useState(0.5);
  const [pending, setPending] = useState<YutGaugeResult | null>(null);

  const isThrowing = Boolean(pending);
  const isRunning = !savedResult && !isThrowing && !cutoffPassed;

  useEffect(() => {
    if (!isRunning) return;

    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const cycle = 1250;
      const progress = (elapsed % cycle) / cycle;
      const position =
        progress < 0.5 ? progress * 2 : 1 - (progress - 0.5) * 2;

      setGaugePosition(position);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isRunning]);

  useEffect(() => {
    if (!pending) return;

    const revealTimer = window.setTimeout(() => {
      setPending(null);
      onFinish(pending);
    }, 1350);

    return () => window.clearTimeout(revealTimer);
  }, [pending, onFinish]);

  function throwYut() {
    if (savedResult || isThrowing || cutoffPassed) return;
    setPending(drawYutResult(gaugePosition));
  }

  const visibleSticks = savedResult
    ? sticksByLabel[savedResult.resultLabel as YutLabel] ?? idleSticks
    : idleSticks;

  return (
    <>
      <div className={styles.yutStage} aria-label="윷 결과 화면">
        <div
          className={[
            styles.yutSticks,
            isThrowing ? styles.throwing : "",
          ].join(" ")}
        >
          {visibleSticks.map((face, index) => (
            <div
              className={[
                styles.stick,
                styles[face],
                isThrowing ? styles[`spin${index + 1}`] : "",
              ].join(" ")}
              key={index}
            >
              <span />
            </div>
          ))}
        </div>
        <p>
          {isThrowing
            ? "윷가락이 떨어지는 중입니다."
            : savedResult
            ? `${String(savedResult.metadata.accuracyBand ?? "").toUpperCase()} · rank ${savedResult.rankValue}`
            : "가운데에 가까울수록 좋은 결과 확률이 올라갑니다."}
        </p>
        <div className={styles.yutMark}>
          {savedResult ? savedResult.resultLabel : "대기"}
        </div>
      </div>

      <div className={styles.gaugeWrap}>
        <div className={styles.gaugeMeta}>
          <span>Bad</span>
          <span>Perfect</span>
          <span>Bad</span>
        </div>
        <div
          aria-label="윷 게이지"
          aria-valuemax={1}
          aria-valuemin={0}
          aria-valuenow={Number(gaugePosition.toFixed(3))}
          className={styles.gauge}
          role="meter"
        >
          <div
            className={styles.marker}
            style={{ left: `${gaugePosition * 100}%` }}
          />
        </div>
      </div>

      <button
        className={styles.actionButton}
        disabled={Boolean(savedResult) || isThrowing || cutoffPassed}
        onClick={throwYut}
        type="button"
      >
        {isThrowing
          ? "윷 던지는 중"
          : savedResult
            ? "오늘은 이미 참여했습니다"
            : cutoffPassed
              ? "오늘 게임이 끝났습니다"
              : "게이지 멈추고 윷 던지기"}
      </button>

      <div className={styles.table}>
        <p className={styles.tableLabel}>확률 테이블</p>
        {probabilityTable.map((row) => (
          <div className={styles.probRow} key={row.band}>
            <strong>{row.band}</strong>
            <span>모 {row.weights["모"]}%</span>
            <span>윷 {row.weights["윷"]}%</span>
            <span>걸 {row.weights["걸"]}%</span>
          </div>
        ))}
      </div>
    </>
  );
}
