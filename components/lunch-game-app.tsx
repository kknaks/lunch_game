"use client";

import { useEffect, useMemo, useState } from "react";
import { todayGame as mockTodayGame } from "@/lib/mock-data";
import {
  changePassword,
  canReadLeaderboard,
  getCurrentUser,
  getLeaderboard,
  getMyTodayResult,
  getTodayGame,
  signInWithEmail,
  signOut,
  submitGameResult,
} from "@/lib/game-service";
import {
  drawYutResult,
  probabilityTable,
  type YutLabel,
  type YutGaugeResult,
} from "@/lib/games/yut-gauge";
import type { DailyGame, LeaderboardRow } from "@/lib/types";
import styles from "./lunch-game-app.module.css";

type PlayState = "aiming" | "throwing" | "submitted";
type ScreenState = "login" | "intro" | "game";
type StickFace = "front" | "back";

const idleSticks: StickFace[] = ["back", "front", "back", "front"];

const sticksByLabel: Record<YutLabel, StickFace[]> = {
  "도": ["front", "back", "back", "back"],
  "개": ["front", "front", "back", "back"],
  "걸": ["front", "front", "front", "back"],
  "윷": ["front", "front", "front", "front"],
  "모": ["back", "back", "back", "back"],
};

function getLosers(rows: LeaderboardRow[]) {
  const submitted = rows.filter((row) => row.rankValue > 0);
  if (submitted.length === 0) return [];
  const min = Math.min(...submitted.map((row) => row.rankValue));
  return submitted.filter((row) => row.rankValue === min);
}

function getRankedRows(rows: LeaderboardRow[]) {
  return rows
    .slice()
    .sort((a, b) => {
      if (a.rankValue === 0) return 1;
      if (b.rankValue === 0) return -1;
      return b.rankValue - a.rankValue;
    })
    .map((row, index) => ({
      ...row,
      rank: row.rankValue > 0 ? index + 1 : null,
    }));
}

function isPastCutoff(cutoffAt: string) {
  return Date.now() >= new Date(cutoffAt).getTime();
}

export function LunchGameApp() {
  const [screenState, setScreenState] = useState<ScreenState>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("1234");
  const [newPassword, setNewPassword] = useState("");
  const [userName, setUserName] = useState("나");
  const [todayGame, setTodayGame] = useState<DailyGame>(mockTodayGame);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [gaugePosition, setGaugePosition] = useState(0.5);
  const [isRunning, setIsRunning] = useState(true);
  const [result, setResult] = useState<YutGaugeResult | null>(null);
  const [pendingResult, setPendingResult] = useState<YutGaugeResult | null>(null);
  const [playState, setPlayState] = useState<PlayState>("aiming");
  const [isBusy, setIsBusy] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [notice, setNotice] = useState("");

  const displayLeaderboard = useMemo(() => {
    if (!result) return leaderboard;
    const base = leaderboard.some((row) => row.name === userName)
      ? leaderboard
      : [...leaderboard, { name: userName, resultLabel: "-", rankValue: 0 }];

    return base.map((row) =>
      row.name === userName
        ? {
            ...row,
            resultLabel: result.resultLabel,
            rankValue: result.rankValue,
          }
        : row,
    );
  }, [leaderboard, result, userName]);

  const losers = useMemo(() => getLosers(displayLeaderboard), [displayLeaderboard]);
  const rankedRows = useMemo(() => getRankedRows(displayLeaderboard), [displayLeaderboard]);
  const hasPastCutoff = isPastCutoff(todayGame.cutoffAt);
  const canSeeResults = Boolean(result) || hasPastCutoff;

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const user = await getCurrentUser();
        if (!user || cancelled) return;

        const game = await getTodayGame();
        const savedResult = await getMyTodayResult(game.id);
        const rows = canReadLeaderboard(game.cutoffAt, Boolean(savedResult))
          ? await getLeaderboard(game.id)
          : [];

        if (cancelled) return;

        setUserName(user.displayName);
        setEmail(user.email);
        setTodayGame(game);
        setLeaderboard(rows);

        if (savedResult) {
          setResult(savedResult as YutGaugeResult);
          setPlayState("submitted");
          setIsRunning(false);
          setScreenState("game");
        } else {
          setScreenState("intro");
        }
      } catch (error) {
        if (!cancelled) setNotice((error as Error).message);
      } finally {
        if (!cancelled) setIsBooting(false);
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin() {
    setIsBusy(true);
    setNotice("");

    try {
      const user = await signInWithEmail(email, password);
      const game = await getTodayGame();
      const savedResult = await getMyTodayResult(game.id);
      const rows = canReadLeaderboard(game.cutoffAt, Boolean(savedResult))
        ? await getLeaderboard(game.id)
        : [];

      setUserName(user.displayName);
      setTodayGame(game);
      setLeaderboard(rows);

      if (savedResult) {
        setResult(savedResult as YutGaugeResult);
        setPlayState("submitted");
        setIsRunning(false);
        setScreenState("game");
      } else {
        setScreenState("intro");
      }
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handlePasswordChange() {
    if (!newPassword) return;
    setIsBusy(true);
    setNotice("");

    try {
      await changePassword(newPassword);
      setNewPassword("");
      setNotice("비밀번호가 변경되었습니다.");
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    setScreenState("login");
    setResult(null);
    setPendingResult(null);
    setPlayState("aiming");
    setIsRunning(true);
  }

  useEffect(() => {
    if (!isRunning || playState !== "aiming") return;

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
  }, [isRunning, playState]);

  useEffect(() => {
    if (playState !== "throwing" || !pendingResult) return;

    const revealTimer = window.setTimeout(async () => {
      const finalResult = pendingResult;
      setResult(finalResult);
      setPlayState("submitted");
      setPendingResult(null);

      try {
        await submitGameResult({
          gameId: todayGame.id,
          score: finalResult.score,
          rankValue: finalResult.rankValue,
          resultLabel: finalResult.resultLabel,
          metadata: finalResult.metadata,
        });
      } catch (error) {
        setNotice(`결과 저장 실패: ${(error as Error).message}`);
        return;
      }

      try {
        const rows = await getLeaderboard(todayGame.id);
        if (rows.length) setLeaderboard(rows);
      } catch (error) {
        setNotice(`랭킹 조회 실패: ${(error as Error).message}`);
      }
    }, 1350);

    return () => window.clearTimeout(revealTimer);
  }, [pendingResult, playState, todayGame.id]);

  function throwYut() {
    if (playState !== "aiming" || hasPastCutoff) return;

    const nextResult = drawYutResult(gaugePosition);
    setIsRunning(false);
    setPendingResult(nextResult);
    setPlayState("throwing");
  }

  const visibleSticks =
    playState === "submitted" && result
      ? sticksByLabel[result.resultLabel]
      : idleSticks;

  const isLocked = playState !== "aiming";
  const participationStatus = result
    ? "참여 완료"
    : screenState === "game"
      ? "게임 진행 중 · 아직 미참여"
      : "미참여";

  return (
    <main className={styles.page}>
      <section className={styles.phone}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Lunch Game</p>
            <h1>오늘의 커피 내기</h1>
          </div>
          <div className={styles.userPill}>
            {screenState === "login" ? "로그인 전" : userName}
          </div>
        </header>

        {isBooting ? (
          <section className={styles.gameCard}>
            <div className={styles.loginPanel}>
              <strong>로그인 상태 확인 중</strong>
              <p>기존 세션이 있으면 바로 오늘의 게임으로 이동합니다.</p>
            </div>
          </section>
        ) : null}

        {!isBooting && screenState === "login" ? (
          <section className={styles.gameCard}>
            <div className={styles.cardTop}>
              <div>
                <p className={styles.sectionLabel}>Login</p>
                <h2>회사 계정으로 시작</h2>
              </div>
              <span className={styles.cutoff}>모바일 전용</span>
            </div>
            <div className={styles.loginPanel}>
              <strong>점심 전 30초 커피 내기</strong>
              <p>로그인하면 오늘의 게임 설명을 보고 참여할 수 있습니다.</p>
              <label className={styles.field}>
                <span>회사 이메일</span>
                <input
                  autoComplete="email"
                  inputMode="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                />
              </label>
              <label className={styles.field}>
                <span>비밀번호</span>
                <input
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  value={password}
                />
              </label>
              {notice ? <p className={styles.notice}>{notice}</p> : null}
            </div>
            <button
              className={styles.throwButton}
              disabled={isBusy || !email || !password}
              onClick={handleLogin}
              type="button"
            >
              {isBusy ? "로그인 중" : "로그인"}
            </button>
          </section>
        ) : null}

        {screenState === "intro" ? (
          <section className={styles.gameCard}>
            <div className={styles.cardTop}>
              <div>
                <p className={styles.sectionLabel}>Today</p>
                <h2>{todayGame.title}</h2>
              </div>
              <span className={styles.cutoff}>{todayGame.cutoffLabel} 종료</span>
            </div>
            <div className={styles.descriptionPanel}>
              <strong>게이지를 보고 윷을 던지세요</strong>
              <p>
                버튼을 누르면 게이지가 멈추고 윷가락을 던집니다. 가운데에
                가까울수록 좋은 결과 확률이 올라가지만, 모가 보장되지는
                않습니다.
              </p>
              <div className={styles.statusGrid}>
                <span>상태</span>
                <strong>{participationStatus}</strong>
              </div>
            </div>
            <button
              className={styles.throwButton}
              disabled={hasPastCutoff}
              onClick={() => setScreenState("game")}
              type="button"
            >
              {hasPastCutoff ? "오늘 게임이 끝났습니다" : "참여하기"}
            </button>
            <div className={styles.settingsPanel}>
              <p className={styles.sectionLabel}>Settings</p>
              <label className={styles.field}>
                <span>새 비밀번호</span>
                <input
                  autoComplete="new-password"
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="새 비밀번호"
                  type="password"
                  value={newPassword}
                />
              </label>
              <button
                className={styles.secondaryButton}
                disabled={isBusy || !newPassword}
                onClick={handlePasswordChange}
                type="button"
              >
                비밀번호 변경
              </button>
              <button className={styles.secondaryButton} onClick={handleSignOut} type="button">
                로그아웃
              </button>
              {notice ? <p className={styles.notice}>{notice}</p> : null}
            </div>
          </section>
        ) : null}

        {screenState === "game" ? (
        <section className={styles.gameCard}>
          <div className={styles.cardTop}>
            <div>
              <p className={styles.sectionLabel}>Daily game</p>
              <h2>{todayGame.title}</h2>
            </div>
              <span className={styles.cutoff}>{participationStatus}</span>
          </div>

          <div className={styles.yutStage} aria-label="윷 결과 화면">
            <div
              className={[
                styles.yutSticks,
                playState === "throwing" ? styles.throwing : "",
              ].join(" ")}
            >
              {visibleSticks.map((face, index) => (
                <div
                  className={[
                    styles.stick,
                    styles[face],
                    playState === "throwing" ? styles[`spin${index + 1}`] : "",
                  ].join(" ")}
                  key={index}
                >
                  <span />
                </div>
              ))}
            </div>
            <p>
              {playState === "throwing"
                ? "윷가락이 떨어지는 중입니다."
                : result
                ? `${result.metadata.accuracyBand.toUpperCase()} · rank ${result.rankValue}`
                : "가운데에 가까울수록 좋은 결과 확률이 올라갑니다."}
            </p>
            <div className={styles.yutMark}>{result ? result.resultLabel : "대기"}</div>
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
            className={styles.throwButton}
            disabled={isLocked || hasPastCutoff}
            onClick={throwYut}
            type="button"
          >
            {playState === "throwing"
              ? "윷 던지는 중"
              : playState === "submitted"
                ? "오늘은 이미 참여했습니다"
                : hasPastCutoff
                  ? "오늘 게임이 끝났습니다"
                : "게이지 멈추고 윷 던지기"}
          </button>
          <p className={styles.finalNotice}>한 번 던지면 다시 참여할 수 없습니다.</p>
        </section>
        ) : null}

        {screenState === "game" && result ? (
        <section className={styles.resultCard}>
          <div>
            <p className={styles.sectionLabel}>내 결과</p>
            <div className={styles.myResult}>
              <span>{result.resultLabel}</span>
              <strong>{result.metadata.accuracyBand.toUpperCase()}</strong>
            </div>
          </div>
        </section>
        ) : null}

        {screenState !== "login" ? (
        <section className={styles.board}>
          <div className={styles.cardTop}>
            <div>
              <p className={styles.sectionLabel}>참여 완료 후 공개</p>
              <h2>오늘의 랭킹</h2>
            </div>
            <span className={styles.loserBadge}>
              {canSeeResults
                ? `꼴찌 ${losers.map((row) => row.name).join(", ")}`
                : "결과 비공개"}
            </span>
          </div>
          {canSeeResults ? (
            <div className={styles.rows}>
              {rankedRows.map((row) => (
                <div className={styles.row} key={row.name}>
                  <div className={styles.rankName}>
                    <span className={styles.rank}>
                      {row.rank ? `${row.rank}등` : "-"}
                    </span>
                    <span>{row.name}</span>
                  </div>
                  <strong>{row.rankValue > 0 ? row.resultLabel : "대기"}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.lockedBoard}>
              <strong>참여하면 바로 공개</strong>
              <p>KST 12:30 전에는 미참여자에게 결과를 보여주지 않습니다.</p>
            </div>
          )}
        </section>
        ) : null}

        {screenState === "game" ? (
        <section className={styles.table}>
          <p className={styles.sectionLabel}>확률 테이블</p>
          {probabilityTable.map((row) => (
            <div className={styles.probRow} key={row.band}>
              <strong>{row.band}</strong>
              <span>모 {row.weights["모"]}%</span>
              <span>윷 {row.weights["윷"]}%</span>
              <span>걸 {row.weights["걸"]}%</span>
            </div>
          ))}
        </section>
        ) : null}
      </section>
    </main>
  );
}
