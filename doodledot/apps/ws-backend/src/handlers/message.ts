import { AuthenticatedSocket, joinRoom, broadcastToRoom } from "../store/rooms";

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

    case "draw":
      broadcastToRoom(socket, rawData.toString());
      break;

    default:
      socket.send(JSON.stringify({ error: `Unknown message type: ${parsed.type}` }));
  }
}
