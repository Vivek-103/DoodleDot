import { Router, type Router as ExpressRouter } from "express";
import { authMiddleware } from "../middleware/auth";

export const roomRouter: ExpressRouter = Router();

roomRouter.post("/", authMiddleware, (_req, res) => {
  // TODO:
  // 1. Validate req.body with createRoomSchema.
  // 2. Read req.userId from the auth middleware.
  // 3. Create a room object with id, name, and adminId.
  // 4. Push the room into rooms.
  // 5. Return status 201 with the new roomId.

  return res.status(501).json({
    message: "POST /room is not implemented yet",
  });
});
