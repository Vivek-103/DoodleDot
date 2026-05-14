"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useWebSocket } from "../../../lib/use-websocket";
import GameCanvas from "../../../components/game-canvas";
import type { DrawPayload } from "../../../components/game-canvas";
import GameChat from "../../../components/game-chat";
import type { ChatEntry } from "../../../components/game-chat";
import styles from "./game.module.css";

interface PlayerInfo {
  userId: string;
  username: string;
  score: number;
}

interface RoomInfo {
  id: string;
  code: string;
  name: string;
}

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function decodeToken(token: string): { userId: string } | null {
  try {
    const parts = token.split(".");
    if (!parts[1]) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [status, setStatus] = useState<string>("waiting");
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(3);
  const [currentDrawerId, setCurrentDrawerId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [chatMessages, setChatMessages] = useState<ChatEntry[]>([]);
  const [finalScores, setFinalScores] = useState<PlayerInfo[]>([]);
  const [winner, setWinner] = useState<PlayerInfo | null>(null);
  const [roundPrompt, setRoundPrompt] = useState<string | null>(null);
  const [correctGuessers, setCorrectGuessers] = useState<{ userId: string; username: string }[]>([]);
  const [codeCopied, setCodeCopied] = useState(false);
  const canvasRef = useRef<{ handleRemoteDraw: (msg: DrawPayload) => void }>(null);

  const isDrawer = userId !== null && userId === currentDrawerId;

  const onMessage = useCallback((msg: Record<string, unknown>) => {
    switch (msg.type) {
      case "room_joined": {
        setPlayers(msg.players as PlayerInfo[]);
        const game = msg.game as Record<string, unknown> | undefined;
        if (game) {
          setStatus(game.status as string);
          setCurrentRound(game.currentRound as number);
          setTotalRounds(game.totalRounds as number);
          setCurrentDrawerId(game.currentDrawerId as string | null);
        }
        setChatMessages([]);
        break;
      }

      case "player_joined":
      case "player_left": {
        setPlayers(msg.players as PlayerInfo[]);
        setChatMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            type: "system",
            message: `${msg.username as string} ${msg.type === "player_joined" ? "joined" : "left"}`,
          },
        ]);
        break;
      }

      case "new_round": {
        setStatus("playing");
        setCurrentRound(msg.round as number);
        setTotalRounds(msg.totalRounds as number);
        setCurrentDrawerId(msg.currentDrawerId as string);
        setPrompt(null);
        setRoundPrompt(null);
        setCorrectGuessers([]);
        setChatMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            type: "system",
            message: `Round ${String(msg.round)} — ${msg.currentDrawerId === userId ? "Your turn to draw!" : "Someone is drawing"}`,
          },
        ]);
        break;
      }

      case "your_prompt": {
        setPrompt(msg.word as string);
        break;
      }

      case "draw": {
        canvasRef.current?.handleRemoteDraw(msg as unknown as DrawPayload);
        break;
      }

      case "timer": {
        setTimer(msg.seconds as number);
        break;
      }

      case "chat": {
        setChatMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            type: "chat",
            userId: msg.userId as string,
            username: msg.username as string,
            message: msg.message as string,
          },
        ]);
        break;
      }

      case "correct_guess": {
        setChatMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            type: "correct_guess",
            userId: msg.userId as string,
            username: msg.username as string,
          },
        ]);
        break;
      }

      case "round_end": {
        setStatus("round_end");
        setRoundPrompt(msg.prompt as string);
        setCorrectGuessers(msg.correctGuessers as { userId: string; username: string }[]);
        setPlayers(msg.players as PlayerInfo[]);
        break;
      }

      case "game_end": {
        setStatus("game_end");
        setFinalScores(msg.finalScores as PlayerInfo[]);
        setWinner(msg.winner as PlayerInfo | null);
        setPlayers(msg.players as PlayerInfo[]);
        break;
      }

      case "game_reset": {
        setStatus("waiting");
        setCurrentRound(0);
        setCurrentDrawerId(null);
        setPrompt(null);
        setRoundPrompt(null);
        setCorrectGuessers([]);
        setFinalScores([]);
        setWinner(null);
        setPlayers(msg.players as PlayerInfo[]);
        setChatMessages([]);
        break;
      }

      case "error": {
        setChatMessages((prev) => [
          ...prev,
          { id: nextId(), type: "system", message: `Error: ${String(msg.message)}` },
        ]);
        break;
      }
    }
  }, [userId]);

  const { send, connected } = useWebSocket(onMessage);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      window.location.href = "/auth";
      return;
    }
    const decoded = decodeToken(t);
    if (decoded) setUserId(decoded.userId);

    fetch(`http://localhost:4000/room/${id}`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setRoom(data);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (connected && id && userId) {
      send({ type: "join_room", roomId: id });
    }
  }, [connected, id, userId, send]);

  function handleChatSend(text: string) {
    send({ type: "chat", message: text });
  }

  function handleStartGame() {
    send({ type: "start_game" });
  }

  function handleNextRound() {
    send({ type: "next_round" });
  }

  function handleCopyCode() {
    if (room) {
      navigator.clipboard.writeText(room.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  }

  const isAdmin = players.length > 0 && players[0]?.userId === userId;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <a href="/dashboard" className={styles.logo}>
          Doodle<span className={styles.logoAccent}>Dot</span>
        </a>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginRight: "auto" }}>
          {room && status === "waiting" && (
            <div
              onClick={handleCopyCode}
              style={{
                fontFamily: "monospace",
                fontSize: "1.1rem",
                letterSpacing: "0.15em",
                color: "var(--coral)",
                cursor: "pointer",
                padding: "4px 12px",
                borderRadius: 8,
                background: "rgba(255,107,107,0.06)",
              }}
              title="Click to copy"
            >
              {room.code}
              {codeCopied && (
                <span style={{ fontSize: "0.75rem", color: "var(--teal)", marginLeft: 8 }}>
                  Copied!
                </span>
              )}
            </div>
          )}

          {status === "playing" && (
          <>
            <div className={`${styles.timer} ${timer <= 10 ? styles.timerUrgent : ""}`}>
              {timer}s
            </div>
            <div className={styles.roundInfo}>
              Round {currentRound}/{totalRounds}
            </div>
            {prompt ? (
              <div className={`${styles.promptBadge} ${styles.promptDrawer}`}>
                Your word: {prompt}
              </div>
            ) : (
              <div className={`${styles.promptBadge} ${styles.promptGuesser}`}>
                {currentDrawerId ? "Someone is drawing..." : "Waiting..."}
              </div>
            )}
          </>
        )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => {
              send({ type: "leave_room" });
              const t = localStorage.getItem("token");
              if (t) {
                fetch(`http://localhost:4000/room/${id}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${t}` },
                }).catch(() => {});
              }
              window.location.href = "/dashboard";
            }}
            style={{
              padding: "6px 16px",
              borderRadius: 100,
              border: "2px solid var(--cream-dark)",
              background: "transparent",
              fontFamily: "var(--font-outfit)",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              color: "var(--text-soft)",
            }}
          >
            Leave
          </button>
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.canvasArea}>
          <GameCanvas ref={canvasRef} send={send} isDrawer={isDrawer} />
        </div>

        <div className={styles.sidebar}>
          <div className={styles.playerList}>
            <div className={styles.playerListTitle}>Players</div>
            {players.map((p) => (
              <div
                key={p.userId}
                className={`${styles.playerItem} ${
                  p.userId === currentDrawerId ? styles.playerDrawer : ""
                } ${
                  correctGuessers.some((g) => g.userId === p.userId)
                    ? styles.playerCorrect
                    : ""
                }`}
              >
                <div
                  className={styles.playerDot}
                  style={{ background: status === "playing" && p.userId === currentDrawerId ? "var(--teal)" : "var(--cream-dark)" }}
                />
                <span className={styles.playerName}>{p.username}</span>
                <span className={styles.playerScore}>{p.score}</span>
                {p.userId === currentDrawerId && (
                  <span className={styles.drawerLabel}>Drawing</span>
                )}
              </div>
            ))}
          </div>

          {status === "waiting" && (
            <div style={{ padding: "8px 0" }}>
              {isAdmin && players.length >= 2 && (
                <button className={styles.overlayBtn} onClick={handleStartGame}>
                  Start Game
                </button>
              )}
              {!isAdmin && (
                <p style={{ fontSize: "0.85rem", color: "var(--text-soft)" }}>
                  Waiting for admin to start...
                </p>
              )}
            </div>
          )}

          <div className={styles.chatArea}>
            <GameChat
              messages={chatMessages}
              onSend={handleChatSend}
              disabled={isDrawer || status !== "playing"}
              placeholder={status === "playing" ? "Type your guess..." : "Game not in progress"}
            />
          </div>
        </div>
      </div>

      {status === "round_end" && roundPrompt && (
        <div className={styles.overlay}>
          <div className={styles.overlayCard}>
            <div className={styles.overlayTitle}>Round Over!</div>
            <div className={styles.overlaySub}>The word was</div>
            <div className={styles.overlayPrompt}>{roundPrompt}</div>
            {correctGuessers.length > 0 ? (
              <div className={styles.overlaySub}>
                {correctGuessers.map((g) => g.username).join(", ")} guessed correctly
              </div>
            ) : (
              <div className={styles.overlaySub}>No one guessed correctly!</div>
            )}
            <div className={styles.overlaySub}>
              {currentRound >= totalRounds
                ? "Showing results..."
                : "Next round starting soon..."}
            </div>
          </div>
        </div>
      )}

      {status === "game_end" && (
        <div className={styles.overlay}>
          <div className={styles.overlayCard}>
            <div className={styles.overlayTitle}>Game Over!</div>
            {winner && (
              <div className={styles.overlaySub}>
                <strong>{winner.username}</strong> wins with {winner.score} points!
              </div>
            )}
            <div style={{ margin: "16px 0" }}>
              {finalScores.map((p, i) => (
                <div
                  key={p.userId}
                  className={`${styles.finalScoreItem} ${
                    i === 0 ? styles.finalScoreWinner : ""
                  }`}
                >
                  <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`} {p.username}</span>
                  <span>{p.score} pts</span>
                </div>
              ))}
            </div>
            {isAdmin && (
              <button className={styles.overlayBtn} onClick={handleNextRound}>
                Play Again
              </button>
            )}
            {!isAdmin && (
              <div className={styles.overlaySub}>Waiting for admin to restart...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
