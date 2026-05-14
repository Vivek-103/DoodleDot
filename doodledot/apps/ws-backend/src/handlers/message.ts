import { AuthenticatedSocket, joinRoom, leaveRoom, broadcastDraw, startGame, handleGuess, handleNextRound } from "../store/rooms";

export function handleMessage(socket: AuthenticatedSocket, rawData: any): void {
  let parsed: { type: string; [key: string]: any };

  try {
    parsed = JSON.parse(rawData.toString());
  } catch {
    socket.send(JSON.stringify({ error: "Invalid JSON" }));
    return;
  }

  switch (parsed.type) {
    case "join_room":
      if (!parsed.roomId) {
        socket.send(JSON.stringify({ error: "roomId required" }));
        return;
      }
      joinRoom(parsed.roomId, socket);
      break;

    case "leave_room":
      if (socket.roomId) {
        leaveRoom(socket);
      }
      break;

    case "draw":
      if (!socket.roomId) return;
      broadcastDraw(socket, rawData.toString());
      break;

    case "start_game": {
      if (!socket.roomId) return;
      const result = startGame(socket.roomId, socket);
      if (!result.ok) {
        socket.send(JSON.stringify({ type: "error", message: result.error }));
      }
      break;
    }

    case "chat":
      if (!parsed.message || typeof parsed.message !== "string") {
        socket.send(JSON.stringify({ error: "message required" }));
        return;
      }
      handleGuess(socket, parsed.message);
      break;

    case "next_round":
      handleNextRound(socket);
      break;

    default:
      socket.send(JSON.stringify({ error: `Unknown message type: ${parsed.type}` }));
  }
}
