import { Router, type Router as ExpressRouter } from "express";
import { randomUUID } from "node:crypto";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { createRoomSchema } from "../schemas/room";
import { rooms, type Room } from "../store/memory";

export const roomRouter: ExpressRouter = Router();

roomRouter.post("/", authMiddleware, (req: AuthRequest, res) => {
  const parsed = createRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid Input",
      errors: parsed.error.issues,
    });
  }

  const room: Room = {
    id: randomUUID(),
    name: parsed.data.name,
    adminId: req.userId!,
  };

  rooms.push(room);

  return res.status(201).json({ roomId: room.id });
});
