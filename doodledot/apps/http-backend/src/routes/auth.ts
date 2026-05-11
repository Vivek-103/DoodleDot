import { Router, type Router as ExpressRouter } from "express";

export const authRouter: ExpressRouter = Router();

authRouter.post("/signup", (_req, res) => {
  // TODO:
  // 1. Validate req.body with signupSchema.
  // 2. Check if the user email already exists in users.
  // 3. Hash the password with bcrypt.
  // 4. Create a user object with id, email, and passwordHash.
  // 5. Push the user into users.
  // 6. Return status 201 with the new userId.

  return res.status(501).json({
    message: "POST /auth/signup is not implemented yet",
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
