import express from "express";
import { config } from "./config";
import { authRouter } from "./routes/auth";
import { roomRouter } from "./routes/room";

const app = express();

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "HTTP backend is running" });
});

app.use("/auth", authRouter);
app.use("/room", roomRouter);

app.listen(config.port, () => {
  console.log(`HTTP backend running on port ${config.port}`);
});
