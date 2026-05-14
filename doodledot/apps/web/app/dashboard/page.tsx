"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";

interface RoomData {
  id: string;
  code: string;
  name: string;
  adminId: string;
}

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createdRoom, setCreatedRoom] = useState<RoomData | null>(null);
  const [error, setError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      window.location.href = "/auth";
      return;
    }
    setToken(t);
    fetchRooms(t);
  }, []);

  async function fetchRooms(t: string) {
    try {
      const res = await fetch("http://localhost:4000/room", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch {
      // server might not be running
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCreatedRoom(null);
    if (!token) return;

    try {
      const res = await fetch("http://localhost:4000/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: createName || "Untitled Room" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to create room");
        return;
      }
      setCreatedRoom(data);
      setCreateName("");
      fetchRooms(token);
    } catch {
      setError("Could not connect to server");
    }
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    setJoinError("");
    if (!joinCode.trim()) return;

    try {
      const res = await fetch("http://localhost:4000/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.message || "Room not found");
        return;
      }
      window.location.href = `/room/${data.id}`;
    } catch {
      setJoinError("Could not connect to server");
    }
  }

  function joinRoom(roomId: string) {
    window.location.href = `/room/${roomId}`;
  }

  function handleLogout() {
    localStorage.removeItem("token");
    window.location.href = "/auth";
  }

  function handleCopyCode() {
    if (createdRoom) {
      navigator.clipboard.writeText(createdRoom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) return null;
  if (!token) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/" className={styles.logo}>
          Doodle<span className={styles.logoAccent}>Dot</span>
        </Link>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Create a Room</h2>
          <form onSubmit={handleCreate}>
            <input
              className={styles.input}
              placeholder="Room name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
              Create Room
            </button>
          </form>
          {error && <p className={styles.errorMsg}>{error}</p>}
          {createdRoom && (
            <div>
              <p className={styles.successMsg}>Room created!</p>
              <div className={styles.codeDisplay} onClick={handleCopyCode} title="Click to copy">
                {createdRoom.code}
              </div>
              {copied && <p className={styles.successMsg}>Copied!</p>}
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                style={{ marginTop: 12 }}
                onClick={() => joinRoom(createdRoom.id)}
              >
                Enter Room
              </button>
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Join by Code</h2>
          <form onSubmit={handleJoin}>
            <input
              className={styles.input}
              placeholder="Enter 6-letter code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center" }}
            />
            <button type="submit" className={`${styles.btn} ${styles.btnSecondary}`}>
              Join Room
            </button>
          </form>
          {joinError && <p className={styles.errorMsg}>{joinError}</p>}
        </div>
      </div>

      {rooms.length > 0 && (
        <div className={styles.roomList}>
          <h2 className={styles.roomListTitle}>Active Rooms</h2>
          {rooms.map((room) => (
            <div key={room.id} className={styles.roomItem}>
              <div>
                <div className={styles.roomName}>{room.name}</div>
                <div className={styles.roomMeta}>
                  Code: <span className={styles.roomCode}>{room.code}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className={styles.joinSmallBtn} onClick={() => joinRoom(room.id)}>
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
