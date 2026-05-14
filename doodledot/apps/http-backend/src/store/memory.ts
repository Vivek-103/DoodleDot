export type User = {
  id: string;
  email: string;
  passwordHash: string;
};

export type Room = {
  id: string;
  code: string;
  name: string;
  adminId: string;
  createdAt: number;
};

export const users: User[] = [];
export const rooms: Room[] = [];

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  if (rooms.find((r) => r.code === code)) return generateRoomCode();
  return code;
}

setInterval(() => {
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (let i = rooms.length - 1; i >= 0; i--) {
    if (rooms[i]!.createdAt < cutoff) {
      rooms.splice(i, 1);
    }
  }
}, 30_000);
