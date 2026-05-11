import { Router, type Router as ExpressRouter } from "express";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import {randomUUID} from "node:crypto"
import {config} from "../config"
import { signinSchema , signupSchema } from "../schemas/auth";
import {users , type User} from "../store/memory"
export const authRouter: ExpressRouter = Router();

authRouter.post("/signup", async(req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if(!parsed.success){
    return res.status(400).json({
      message : "Invalid Input",
      errors : parsed.error.issues,
    });
  }
  const {email , password} = parsed.data;

  const existingUser = users.find((user) =>user.email == email);

  if(existingUser){
    return res.status(409).json({message : "User already exist"});
  }

  const passwordHash = await bcrypt.hash(password,10);
  const user : User = {
    id : randomUUID(),
    email,
    passwordHash
  };
  users.push(user);

  return res.status(201).json({
    message:"User Created successfully",
    userId : user.id,
  }); 
});

authRouter.post("/signin", (_req, res) => {
  // TODO:
  // 1. Validate req.body with signinSchema.
  // 2. Find the user by email.
  // 3. Compare the password with bcrypt.
  // 4. If valid, create a JWT containing userId.
  // 5. Return the token.

  return res.status(501).json({
    message: "POST /auth/signin is not implemented yet",
  });
});
