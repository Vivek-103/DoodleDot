import express from "express";
import { config } from "./config";
import { authRouter } from "./routes/auth";
import { roomRouter } from "./routes/room";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "HTTP backend is running" });
});

app.use("/auth", authRouter);
app.use("/room", roomRouter);

app.listen(config.port, () => {
  console.log(`HTTP backend running on port ${config.port}`);
});
