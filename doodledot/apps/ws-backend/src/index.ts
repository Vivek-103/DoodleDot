import { WebSocketServer } from "ws";
import { config } from "./config";
import { handleConnection } from "./handlers/connection";

const wss = new WebSocketServer({ port: config.port });

wss.on("connection", handleConnection);

console.log(`WebSocket server running on port ${config.port}`);
