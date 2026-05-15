# 🎨 DoodleDot

**Draw. Guess. Laugh.**

A real-time multiplayer drawing and guessing game. Grab some friends, get a wacky prompt, and doodle your heart out before the timer runs out.

## 🚀 Quick Start

```bash
# Terminal 1 — HTTP backend
cd apps/http-backend
npm run dev

# Terminal 2 — WebSocket backend
cd apps/ws-backend
npm run dev

# Terminal 3 — Frontend
cd apps/web
pnpm dev
```

Open `http://localhost:3000`, sign up, and start a room.

## 🎮 How It Works

1. **Create a room** — Share the 6-letter code with friends
2. **Draw the prompt** — Each player takes turns drawing a random word
3. **Guess in real-time** — Type your guesses as the drawing happens
4. **Score points** — Faster guesses earn more points. Most points wins!


## ✨ Features

- **Live drawing** — Every stroke streams to all players instantly
- **Smart cursor** — Dot preview shows your exact brush size and color
- **Brush controls** — 10 colors, adjustable size, eraser mode
- **Auto-advance** — Rounds flow automatically, no waiting for admins
- **250+ prompts** — From "apple" to "zeppelin", with plenty of chaos in between
- **Mobile-ready** — Touch events work for drawing on phones and tablets
- **Persistent rooms** — Create, share codes, and play instantly

## 🛠️ Built With

- [Next.js 16](https://nextjs.org/) — React framework
- [Express 5](https://expressjs.com/) — HTTP server
- [ws](https://github.com/websockets/ws) — WebSocket server
- [TypeScript](https://www.typescriptlang.org/) — Everywhere
- [Turborepo](https://turbo.build/) — Monorepo orchestration
- [pnpm](https://pnpm.io/) — Package manager



## 🧑‍🎨 The DoodleDot Experience

| Round | Drawer | Everyone Else |
|---|---|---|
| You draw | See your secret prompt + brush tools | Watch you draw, type guesses |
| They draw | Try to guess from their doodles | See a different player draw |

Points stack: **100 base + seconds remaining** for each correct guess.
