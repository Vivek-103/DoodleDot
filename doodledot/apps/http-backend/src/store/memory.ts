export type User = {
  id: string;
  email: string;
  passwordHash: string;
};

export type Room = {
  id: string;
  name: string;
  adminId: string;
};

// TODO: Replace these arrays with a real database later.
export const users: User[] = [];
export const rooms: Room[] = [];
