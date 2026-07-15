"use client";

import { useEffect, useState } from "react";
import { deckSize, drawCard, type CardDrawResult } from "@/lib/games/card-draw";
import type { GamePlayProps } from "./types";
import styles from "./card-draw-play.module.css";

const riffleCards = [1, 2, 3, 4, 5, 6] as const;

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
              <span className={styles.suitBig}>{card.suitSymbol}</span>
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
            ? `${deckSize}장 중 ${savedResult.rankValue}번째 서열 카드입니다.`
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
