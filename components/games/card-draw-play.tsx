"use client";

import { useEffect, useState } from "react";
import { deckSize, drawCard, type CardDrawResult } from "@/lib/games/card-draw";
import type { GamePlayProps } from "./types";
import styles from "./card-draw-play.module.css";

const riffleCards = [1, 2, 3, 4, 5, 6] as const;

const courtValues = ["J", "Q", "K"];

// 숫자 카드의 핍(무늬) 배치: [x%, y%] — 실제 트럼프 카드 배열
const pipLayouts: Record<string, [number, number][]> = {
  "2": [[50, 16], [50, 84]],
  "3": [[50, 16], [50, 50], [50, 84]],
  "4": [[32, 16], [68, 16], [32, 84], [68, 84]],
  "5": [[32, 16], [68, 16], [50, 50], [32, 84], [68, 84]],
  "6": [[32, 16], [68, 16], [32, 50], [68, 50], [32, 84], [68, 84]],
  "7": [[32, 16], [68, 16], [50, 33], [32, 50], [68, 50], [32, 84], [68, 84]],
  "8": [[32, 16], [68, 16], [50, 33], [32, 50], [68, 50], [50, 67], [32, 84], [68, 84]],
  "9": [[32, 14], [68, 14], [32, 38], [68, 38], [50, 50], [32, 62], [68, 62], [32, 86], [68, 86]],
  "10": [[32, 14], [68, 14], [50, 26], [32, 38], [68, 38], [32, 62], [68, 62], [50, 74], [32, 86], [68, 86]],
};

function parseCardLabel(label: string) {
  const suitSymbol = label.slice(0, 1);
  const value = label.slice(1);
  const isRed = suitSymbol === "♥" || suitSymbol === "♦";
  return { suitSymbol, value, isRed };
}

export function CardDrawPlay({ savedResult, cutoffPassed, onFinish }: GamePlayProps) {
  const [isShuffling, setIsShuffling] = useState(false);
  const [pending, setPending] = useState<CardDrawResult | null>(null);

  const isRevealing = Boolean(pending);
  const locked = Boolean(savedResult) || isRevealing || cutoffPassed;

  useEffect(() => {
    if (!pending) return;

    const revealTimer = window.setTimeout(() => {
      setPending(null);
      onFinish(pending);
    }, 1000);

    return () => window.clearTimeout(revealTimer);
  }, [pending, onFinish]);

  function startShuffle() {
    if (locked) return;
    setIsShuffling(true);
  }

  function releaseShuffle() {
    if (!isShuffling) return;
    setIsShuffling(false);
    setPending(drawCard());
  }

  const finalLabel = savedResult?.resultLabel ?? pending?.resultLabel ?? null;
  const card = finalLabel ? parseCardLabel(finalLabel) : null;

  return (
    <>
      <div className={styles.cardStage} aria-label="카드 결과 화면">
        {card ? (
          <div
            className={[
              styles.flipCard,
              isRevealing ? styles.flipping : styles.flipped,
            ].join(" ")}
          >
            <div className={[styles.cardFace, styles.cardBackFace].join(" ")}>
              <span />
            </div>
            <div
              className={[
                styles.cardFace,
                styles.cardFrontFace,
                card.isRed ? styles.redSuit : "",
              ].join(" ")}
            >
              <span className={styles.cornerTop}>
                {card.value}
                <em>{card.suitSymbol}</em>
              </span>
              {card.value === "A" ? (
                <span className={styles.suitBig}>{card.suitSymbol}</span>
              ) : courtValues.includes(card.value) ? (
                <span className={styles.courtBox}>
                  <strong>{card.value}</strong>
                  <em>{card.suitSymbol}</em>
                </span>
              ) : (
                <span className={styles.pipArea}>
                  {pipLayouts[card.value]?.map(([x, y], index) => (
                    <i
                      className={[
                        styles.pip,
                        y > 50 ? styles.pipFlipped : "",
                      ].join(" ")}
                      key={index}
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      {card.suitSymbol}
                    </i>
                  ))}
                </span>
              )}
              <span className={styles.cornerBottom}>
                {card.value}
                <em>{card.suitSymbol}</em>
              </span>
            </div>
          </div>
        ) : (
          <div
            className={[styles.deck, isShuffling ? styles.shuffling : ""].join(" ")}
          >
            <div className={[styles.half, styles.halfLeft].join(" ")}>
              <div className={styles.stackCard} />
              <div className={styles.stackCard} />
              <div className={styles.stackCard} />
            </div>
            <div className={[styles.half, styles.halfRight].join(" ")}>
              <div className={styles.stackCard} />
              <div className={styles.stackCard} />
              <div className={styles.stackCard} />
            </div>
            {riffleCards.map((index) => (
              <div
                className={[styles.flyer, styles[`flyer${index}`]].join(" ")}
                key={index}
              />
            ))}
          </div>
        )}
        <p>
          {isRevealing
            ? "카드를 뒤집는 중입니다."
            : savedResult
            ? `${deckSize}장 중 ${deckSize - savedResult.rankValue + 1}번째로 높은 카드입니다.`
            : isShuffling
              ? "손을 떼는 순간의 카드가 내 카드!"
              : "버튼을 누르고 있는 동안 카드를 섞습니다."}
        </p>
        <div className={styles.cardMark}>
          {savedResult ? savedResult.resultLabel : "대기"}
        </div>
      </div>

      <button
        className={[
          styles.actionButton,
          isShuffling ? styles.holding : "",
        ].join(" ")}
        disabled={locked}
        onContextMenu={(event) => event.preventDefault()}
        onPointerCancel={releaseShuffle}
        onPointerDown={startShuffle}
        onPointerLeave={releaseShuffle}
        onPointerUp={releaseShuffle}
        type="button"
      >
        {isRevealing
          ? "카드 확인 중"
          : savedResult
            ? "오늘은 이미 참여했습니다"
            : cutoffPassed
              ? "오늘 게임이 끝났습니다"
              : isShuffling
                ? "손을 떼면 카드 공개!"
                : "꾹 누르고 있으면 카드 섞기"}
      </button>
    </>
  );
}
