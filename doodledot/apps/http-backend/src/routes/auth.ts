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

authRouter.post("/signin", async(req, res) => {
  const parsed = signinSchema.safeParse(req.body);
  if(!parsed.success){
    return res.status(400).json({
      message : "Invalid Input",
      errors : parsed.error.issues
    });
  }
  const {email , password} = parsed.data
  const user = users.find((u) => u.email === email);
  if(!user){
    return res.status(401).json({ message : "Invalid Email or password"});
  }
  const valid = await bcrypt.compare(password , user.passwordHash);

  if(!valid){
    return res.status(401).json({message : "Invalide email or password"});
  }

  const token = jwt.sign({userId : user.id} , config.jwtSecret);return res.json({token});
});
