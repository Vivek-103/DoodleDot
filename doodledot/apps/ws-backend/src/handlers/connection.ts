import { WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { IncomingMessage } from "http";
import { config } from "../config";
import { AuthenticatedSocket, leaveRoom } from "../store/rooms";
import { handleMessage } from "./message";

export function handleConnection(ws: WebSocket, req: IncomingMessage): void {
  const socket = ws as AuthenticatedSocket;

  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const token = url.searchParams.get("token");

  if (!token) {
    socket.close(4001, "Token missing");
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    socket.userId = decoded.userId;
    console.log(`User ${socket.userId} connected`);
  } catch {
    socket.close(4001, "Invalid token");
    return;
  }

  socket.on("message", (data: any) => {
    handleMessage(socket, data);
  });

  socket.on("close", () => {
    console.log(`User ${socket.userId} disconnected`);
    leaveRoom(socket);
  });
}
