import { WebSocket } from "ws";
import { getRandomPrompts } from "../game/prompts";

export type AuthenticatedSocket = WebSocket & {
  userId: string;
  roomId?: string;
};

export interface PlayerInfo {
  userId: string;
  username: string;
  score: number;
  hasGuessedCorrectly: boolean;
}

export interface GameState {
  status: "waiting" | "playing" | "round_end" | "game_end";
  currentRound: number;
  totalRounds: number;
  currentDrawerId: string | null;
  prompt: string | null;
  prompts: string[];
  timer: number;
  timerInterval: ReturnType<typeof setInterval> | null;
  roundEndTimeout: ReturnType<typeof setTimeout> | null;
  scores: Record<string, number>;
}

interface RoomData {
  sockets: Set<AuthenticatedSocket>;
  game: GameState;
}

const rooms = new Map<string, RoomData>();

function getUsername(socket: AuthenticatedSocket): string {
  return socket.userId.slice(0, 8);
}

function send(socket: AuthenticatedSocket, data: Record<string, unknown>): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

function broadcastToRoom(roomId: string, data: Record<string, unknown>, exclude?: AuthenticatedSocket): void {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify(data);
  for (const s of room.sockets) {
    if (s !== exclude && s.readyState === WebSocket.OPEN) {
      s.send(msg);
    }
  }
}

function broadcastToAll(roomId: string, data: Record<string, unknown>): void {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify(data);
  for (const s of room.sockets) {
    if (s.readyState === WebSocket.OPEN) {
      s.send(msg);
    }
  }
}

function getPlayers(roomId: string): PlayerInfo[] {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.sockets).map((s) => ({
    userId: s.userId,
    username: getUsername(s),
    score: room.game.scores[s.userId] ?? 0,
    hasGuessedCorrectly: false,
  }));
}

export function joinRoom(roomId: string, socket: AuthenticatedSocket): void {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      sockets: new Set(),
      game: {
        status: "waiting",
        currentRound: 0,
        totalRounds: 5,
        currentDrawerId: null,
        prompt: null,
        prompts: [],
        timer: 60,
        timerInterval: null,
        roundEndTimeout: null,
        scores: {},
      },
    });
  }

  const room = rooms.get(roomId)!;

  for (const existing of room.sockets) {
    if (existing.userId === socket.userId && existing !== socket) {
      existing.close(4000, "New connection opened");
      room.sockets.delete(existing);
    }
  }

  room.sockets.add(socket);
  socket.roomId = roomId;

  broadcastToAll(roomId, {
    type: "player_joined",
    userId: socket.userId,
    username: getUsername(socket),
    players: getPlayers(roomId),
  });

  send(socket, {
    type: "room_joined",
    roomId,
    players: getPlayers(roomId),
    game: {
      status: room.game.status,
      currentRound: room.game.currentRound,
      totalRounds: room.game.totalRounds,
      currentDrawerId: room.game.currentDrawerId,
    },
  });

  console.log(`User ${socket.userId} joined room ${roomId}`);
}

export function leaveRoom(socket: AuthenticatedSocket): void {
  if (!socket.roomId) return;
  const room = rooms.get(socket.roomId);
  if (room) {
    const wasDrawer = room.game.status === "playing" && socket.userId === room.game.currentDrawerId;

    room.sockets.delete(socket);

    if (wasDrawer && room.sockets.size > 0) {
      endRound(socket.roomId);
    }

    broadcastToAll(socket.roomId, {
      type: "player_left",
      userId: socket.userId,
      username: getUsername(socket),
      players: getPlayers(socket.roomId),
    });

    if (room.sockets.size === 0) {
      if (room.game.timerInterval) clearInterval(room.game.timerInterval);
      const rid = socket.roomId;
      rooms.delete(rid);
      fetch(`http://localhost:4000/room/${rid}`, { method: "DELETE" }).catch(() => {});
    }
  }
  socket.roomId = undefined;
}

export function broadcastDraw(
  sender: AuthenticatedSocket,
  rawMessage: string,
): void {
  if (!sender.roomId) return;
  const room = rooms.get(sender.roomId);
  if (!room) return;
  for (const s of room.sockets) {
    if (s !== sender && s.readyState === WebSocket.OPEN) {
      s.send(rawMessage);
    }
  }
}

export function startGame(roomId: string, socket: AuthenticatedSocket): { ok: boolean; error?: string } {
  const room = rooms.get(roomId);
  if (!room) return { ok: false, error: "Room not found" };

  if (room.game.status !== "waiting") return { ok: false, error: "Game already started" };
  if (room.sockets.size < 2) return { ok: false, error: "Need at least 2 players" };

  const firstSocket = Array.from(room.sockets)[0];
  if (firstSocket?.userId !== socket.userId) return { ok: false, error: "Only admin can start" };

  room.game.totalRounds = Math.max(5, room.sockets.size);
  room.game.prompts = getRandomPrompts(room.game.totalRounds);
  room.game.currentRound = 1;
  startRound(roomId);

  return { ok: true };
}

function startRound(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;

  const players = Array.from(room.sockets);
  const drawerIndex = (room.game.currentRound - 1) % players.length;
  const drawerId = players[drawerIndex]!.userId;
  room.game.currentDrawerId = drawerId;
  room.game.prompt = room.game.prompts.shift() ?? "doodle";
  room.game.status = "playing";
  room.game.timer = 60;

  for (const s of room.sockets) {
    (s as any)._hasGuessedCorrectly = false;
  }

  broadcastToAll(roomId, {
    type: "new_round",
    round: room.game.currentRound,
    totalRounds: room.game.totalRounds,
    currentDrawerId: drawerId,
    players: getPlayers(roomId),
  });

  for (const s of room.sockets) {
    if (s.userId === drawerId) {
      send(s, { type: "your_prompt", word: room.game.prompt });
    }
  }

  if (room.game.timerInterval) clearInterval(room.game.timerInterval);
  room.game.timerInterval = setInterval(() => {
    room.game.timer--;
    broadcastToAll(roomId, { type: "timer", seconds: room.game.timer });
    if (room.game.timer <= 0) {
      endRound(roomId);
    }
  }, 1000);
}

function endRound(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;

  if (room.game.timerInterval) {
    clearInterval(room.game.timerInterval);
    room.game.timerInterval = null;
  }

  if (room.game.roundEndTimeout) {
    clearTimeout(room.game.roundEndTimeout);
    room.game.roundEndTimeout = null;
  }

  room.game.status = "round_end";

  const players = getPlayers(roomId);
  const correctGuessers = Array.from(room.sockets)
    .filter((s) => (s as any)._hasGuessedCorrectly)
    .map((s) => ({ userId: s.userId, username: getUsername(s) }));

  broadcastToAll(roomId, {
    type: "round_end",
    prompt: room.game.prompt,
    scores: players.map((p) => ({ userId: p.userId, username: p.username, score: p.score })),
    currentDrawerId: room.game.currentDrawerId,
    correctGuessers,
    players,
  });

  room.game.roundEndTimeout = setTimeout(() => {
    const r = rooms.get(roomId);
    if (!r) return;
    if (r.game.status !== "round_end") return;
    r.game.roundEndTimeout = null;
    if (r.game.currentRound >= r.game.totalRounds) {
      endGame(roomId);
    } else {
      r.game.currentRound++;
      startRound(roomId);
    }
  }, 5000);
}

function endGame(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;

  if (room.game.timerInterval) {
    clearInterval(room.game.timerInterval);
    room.game.timerInterval = null;
  }
  if (room.game.roundEndTimeout) {
    clearTimeout(room.game.roundEndTimeout);
    room.game.roundEndTimeout = null;
  }

  room.game.status = "game_end";

  const players = getPlayers(roomId);
  const sorted = [...players].sort((a, b) => b.score - a.score);

  broadcastToAll(roomId, {
    type: "game_end",
    finalScores: sorted,
    winner: sorted[0] ?? null,
    players,
  });
}

export function handleGuess(
  socket: AuthenticatedSocket,
  message: string,
): void {
  if (!socket.roomId) return;
  const room = rooms.get(socket.roomId);
  if (!room) return;
  if (room.game.status !== "playing") return;
  if (socket.userId === room.game.currentDrawerId) return;
  if ((socket as any)._hasGuessedCorrectly) return;

  const normalisedGuess = message.toLowerCase().trim();
  const normalisedPrompt = room.game.prompt?.toLowerCase().trim() ?? "";

  broadcastToAll(socket.roomId, {
    type: "chat",
    userId: socket.userId,
    username: getUsername(socket),
    message,
  });

  if (normalisedGuess === normalisedPrompt) {
    (socket as any)._hasGuessedCorrectly = true;

    const timeBonus = Math.max(0, room.game.timer);
    const score = 100 + timeBonus;
    room.game.scores[socket.userId] = (room.game.scores[socket.userId] ?? 0) + score;

    broadcastToAll(socket.roomId, {
      type: "correct_guess",
      userId: socket.userId,
      username: getUsername(socket),
    });

    const allGuessed = Array.from(room.sockets).every(
      (s) => s.userId === room.game.currentDrawerId || (s as any)._hasGuessedCorrectly,
    );
    if (allGuessed) {
      endRound(socket.roomId);
    }
  }
}

export function handleNextRound(socket: AuthenticatedSocket): void {
  if (!socket.roomId) return;
  const room = rooms.get(socket.roomId);
  if (!room) return;

  if (room.game.status === "game_end") {
    if (room.game.timerInterval) {
      clearInterval(room.game.timerInterval);
      room.game.timerInterval = null;
    }
    if (room.game.roundEndTimeout) {
      clearTimeout(room.game.roundEndTimeout);
      room.game.roundEndTimeout = null;
    }
    room.game.status = "waiting";
    room.game.currentRound = 0;
    room.game.currentDrawerId = null;
    room.game.prompt = null;
    room.game.prompts = [];
    room.game.timer = 60;
    room.game.scores = {};
    broadcastToAll(socket.roomId, {
      type: "game_reset",
      players: getPlayers(socket.roomId),
    });
    return;
  }

  if (room.game.status !== "round_end") return;

  const players = Array.from(room.sockets);
  const adminId = players[0]?.userId;
  if (socket.userId !== adminId) return;

  if (room.game.roundEndTimeout) {
    clearTimeout(room.game.roundEndTimeout);
    room.game.roundEndTimeout = null;
  }

  if (room.game.currentRound >= room.game.totalRounds) {
    endGame(socket.roomId);
  } else {
    room.game.currentRound++;
    startRound(socket.roomId);
  }
}
