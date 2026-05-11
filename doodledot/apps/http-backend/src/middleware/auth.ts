import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import { config } from "../config";

export type AuthRequest = Request & {
  userId?: string;
};

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  // 1. Read req.headers.authorization.
  const authHeader = req.headers.authorization;
  // 2. Check that it looks like: Bearer <token>.
  if(!authHeader){
    return res.json(401).json({message : "Authorization Header Missing"});
  }
  // 3. Verify the token using jsonwebtoken and config.jwtSecret.
  const token =authHeader.split(" ")[1];
  if(!token){
    return res.status(401).json({
      message : "Token Missing"
    });
  }

  try{
    const decoded = jwt.verify(token , config.jwtSecret) as {
      userId : string;
    };
    // 4. Put decoded.userId on req.userId.
  req.userId = decoded.userId;
  // 5. Call next().
  next();
  }catch{
    return res.status(501).json({
      message: "authMiddleware is not implemented yet",
    });
  }
}
