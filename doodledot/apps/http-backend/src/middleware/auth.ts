import type { NextFunction, Request, Response } from "express";

export type AuthRequest = Request & {
  userId?: string;
};

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  // TODO:
  // 1. Read req.headers.authorization.
  // 2. Check that it looks like: Bearer <token>.
  // 3. Verify the token using jsonwebtoken and config.jwtSecret.
  // 4. Put decoded.userId on req.userId.
  // 5. Call next().
  //
  // For now this returns 501 so the file compiles while you write the logic.
  void req;
  void next;

  return res.status(501).json({
    message: "authMiddleware is not implemented yet",
  });
}
