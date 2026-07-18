"use client";

import { useEffect, useState } from "react";
import {
  drawArcheryResult,
  getGaugeSpeedMultiplier,
  perfectPoint,
  type ArcheryResult,
} from "@/lib/games/archery";
import type { GamePlayProps } from "./types";
import styles from "./archery-play.module.css";

type Phase = "aiming" | "flying" | "landed";

const TARGET_RADIUS = 75;

function formatGaugePercent(result: { metadata: Record<string, unknown> }) {
  const position = Number(result.metadata.gaugePosition);
  if (!Number.isFinite(position)) return "";
  return `${(position * 100).toFixed(1)}%`;
}

function getHitOffset(score: number, hitAngle: number) {
  if (score === 0) {
    // 낙: 과녁 오른쪽 위로 빗나감
    return { x: TARGET_RADIUS * 1.35, y: -TARGET_RADIUS * 0.42 };
  }

  // 점수 링의 한가운데 반지름에 꽂기 (10점=중앙, 1점=바깥 링)
  const ratio = (10.5 - score) / 10;
  const rad = (hitAngle * Math.PI) / 180;
  return {
    x: Math.cos(rad) * ratio * TARGET_RADIUS,
    y: Math.sin(rad) * ratio * TARGET_RADIUS,
  };
}

export function ArcheryPlay({ savedResult, cutoffPassed, onFinish }: GamePlayProps) {
  const [gaugePosition, setGaugePosition] = useState(0);
  const [pending, setPending] = useState<ArcheryResult | null>(null);
  const [phase, setPhase] = useState<Phase>("aiming");

  const isRunning = !savedResult && !pending && !cutoffPassed;

  useEffect(() => {
    if (!isRunning) return;

    let frame = 0;
    let last = performance.now();
    let position = 0;
    let direction = 1;

    const tick = (now: number) => {
      const delta = Math.min(50, now - last);
      last = now;

      position += direction * (delta / 2100) * getGaugeSpeedMultiplier(position);

      // 끝에 닿으면 되돌아온다 (처음으로 점프하지 않음)
      if (position >= 1) {
        position = 2 - position;
        direction = -1;
      } else if (position <= 0) {
        position = -position;
        direction = 1;
      }

      setGaugePosition(position);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isRunning]);

  useEffect(() => {
    if (!pending) return;

    setPhase("flying");
    const landTimer = window.setTimeout(() => setPhase("landed"), 3050);
    const finishTimer = window.setTimeout(() => {
      const finalResult = pending;
      setPending(null);
      setPhase("aiming");
      onFinish(finalResult);
    }, 4400);

    return () => {
      window.clearTimeout(landTimer);
      window.clearTimeout(finishTimer);
    };
  }, [pending, onFinish]);

  function shoot() {
    if (savedResult || pending || cutoffPassed) return;
    setPending(drawArcheryResult(gaugePosition));
  }

  const activeResult =
    savedResult ?? (phase === "landed" && pending ? pending : null);
  const activeScore = activeResult
    ? Number(activeResult.metadata.score ?? Math.max(0, activeResult.rankValue - 1))
    : null;
  const activeAngle = activeResult
    ? Number(activeResult.metadata.hitAngle ?? (activeResult.rankValue * 47) % 360)
    : 0;
  const hit =
    activeScore !== null ? getHitOffset(activeScore, activeAngle) : null;

  const isApproaching = phase === "flying";
  const isZoomed = Boolean(savedResult) || phase === "landed";

  return (
    <>
      <div className={styles.archeryStage} aria-label="양궁 결과 화면">
        <div className={styles.scene}>
          <div
            className={[
              styles.targetWrap,
              isApproaching ? styles.approaching : "",
              isZoomed ? styles.zoomed : "",
            ].join(" ")}
          >
            <div className={styles.targetStand} />
            <div className={styles.targetShadow} />
            <div className={styles.target} />
            {hit ? (
              <div
                className={[
                  styles.arrowHit,
                  activeScore === 0 ? styles.arrowMiss : "",
                ].join(" ")}
                style={{
                  transform: `translate(calc(-50% + ${hit.x}px), calc(-50% + ${hit.y}px)) rotate(45deg)`,
                }}
              >
                <span className={styles.arrowShaft} />
                <span className={styles.arrowNock} />
              </div>
            ) : null}
          </div>
          {phase === "flying" ? <div className={styles.arrowFly} /> : null}
        </div>
        <p>
          {phase === "flying"
            ? "화살이 날아갑니다…"
            : activeResult
                ? activeScore === 0
                  ? `게이지 ${formatGaugePercent(activeResult)} — 너무 지나쳐서 낙! 과녁을 빗나갔습니다.`
                  : `게이지 ${formatGaugePercent(activeResult)} → ${activeScore}점 라인에 명중!`
                : "만점(80%)에서 멀어질수록 점수가 낮아집니다. 지나친 쪽은 더 가파르게, 끝까지 가면 낙!"}
        </p>
        <div className={styles.scoreMark}>
          {savedResult ? savedResult.resultLabel : "대기"}
        </div>
      </div>

      <div className={styles.gaugeWrap}>
        <div className={styles.gaugeMeta}>
          <span>0점</span>
          <span className={styles.perfectLabel}>만점</span>
          <span>낙</span>
        </div>
        <div
          aria-label="양궁 게이지"
          aria-valuemax={1}
          aria-valuemin={0}
          aria-valuenow={Number(gaugePosition.toFixed(3))}
          className={styles.gauge}
          role="meter"
        >
          <div
            className={styles.perfectTick}
            style={{ left: `${perfectPoint * 100}%` }}
          />
          <div
            className={styles.marker}
            style={{ left: `${gaugePosition * 100}%` }}
          />
        </div>
      </div>

      <button
        className={styles.actionButton}
        disabled={Boolean(savedResult) || Boolean(pending) || cutoffPassed}
        onClick={shoot}
        type="button"
      >
        {pending
          ? "화살 날아가는 중"
          : savedResult
            ? "오늘은 이미 참여했습니다"
            : cutoffPassed
              ? "오늘 게임이 끝났습니다"
              : "지금 발사!"}
      </button>
    </>
  );
}
