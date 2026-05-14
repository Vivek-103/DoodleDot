import { Router, type Router as ExpressRouter } from "express";
import { randomUUID } from "node:crypto";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { createRoomSchema, joinRoomSchema } from "../schemas/room";
import { rooms, type Room, generateRoomCode, users } from "../store/memory";

export const roomRouter: ExpressRouter = Router();

function sanitizeRoom(room: Room) {
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    adminId: room.adminId,
  } as const;
}

roomRouter.post("/", authMiddleware, (req: AuthRequest, res) => {
  const parsed = createRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid Input",
      errors: parsed.error.issues,
    });
  }

  const admin = users.find((u) => u.id === req.userId);
  const adminName = admin ? admin.email.split("@")[0] : "Unknown";

  const room: Room = {
    id: randomUUID(),
    code: generateRoomCode(),
    name: parsed.data.name,
    adminId: req.userId!,
    createdAt: Date.now(),
  };

  rooms.push(room);

  return res.status(201).json(sanitizeRoom(room));
});

roomRouter.get("/", (_req, res) => {
  return res.json(rooms.map(sanitizeRoom));
});

roomRouter.get("/:id", (req, res) => {
  const room = rooms.find((r) => r.id === req.params.id);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }
  return res.json(sanitizeRoom(room));
});

roomRouter.post("/join", (req, res) => {
  const parsed = joinRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid Input",
      errors: parsed.error.issues,
    });
  }

  const room = rooms.find((r) => r.code === parsed.data.code);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  return res.json(sanitizeRoom(room));
});

roomRouter.delete("/:id", authMiddleware, (req: AuthRequest, res) => {
  const room = rooms.find((r) => r.id === req.params.id);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }
  if (room.adminId !== req.userId) {
    return res.status(403).json({ message: "Only the room creator can delete this room" });
  }
  const index = rooms.indexOf(room);
  rooms.splice(index, 1);
  return res.json({ message: "Room deleted" });
});
