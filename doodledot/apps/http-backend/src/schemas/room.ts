import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().min(1),
});

export const joinRoomSchema = z.object({
  code: z.string().length(6),
});
