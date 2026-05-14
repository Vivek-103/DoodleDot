import { WebSocket } from "ws";

export type AuthenticatedSocket = WebSocket & {
  userId: string;
  roomId?: string;
};

const rooms = new Map<string, Set<AuthenticatedSocket>>();

export function joinRoom(roomId: string, socket: AuthenticatedSocket): void {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId)!.add(socket);
  socket.roomId = roomId;
  console.log(`User ${socket.userId} joined room ${roomId}`);
}

export function leaveRoom(socket: AuthenticatedSocket): void {
  if (!socket.roomId) return;
  const room = rooms.get(socket.roomId);
  if (room) {
    room.delete(socket);
    if (room.size === 0) {
      rooms.delete(socket.roomId);
    }
  }
  socket.roomId = undefined;
}

export function broadcastToRoom(
  sender: AuthenticatedSocket,
  message: string,
): void {
  if (!sender.roomId) return;
  const room = rooms.get(sender.roomId);
  if (!room) return;
  for (const socket of room) {
    if (socket !== sender && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }
}
