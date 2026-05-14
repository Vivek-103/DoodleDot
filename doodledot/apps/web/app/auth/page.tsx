"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import styles from "./auth.module.css";

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const endpoint = isSignup ? "/auth/signup" : "/auth/signin";

    const res = await fetch(`http://localhost:4000${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Something went wrong");
      return;
    }

    localStorage.setItem("token", data.token);
    window.location.href = "/dashboard";
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.logo}>
          Doodle<span className={styles.logoAccent}>Dot</span>
        </Link>
        <p className={styles.subtitle}>Draw. Guess. Laugh.</p>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${isSignup ? styles.tabActive : ""}`}
            onClick={() => setIsSignup(true)}
          >
            Sign Up
          </button>
          <button
            className={`${styles.tab} ${!isSignup ? styles.tabActive : ""}`}
            onClick={() => setIsSignup(false)}
          >
            Sign In
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div>
            <label className={styles.label}>Email</label>
            <div className={styles.inputWrapper}>
              <input
                className={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <input
                className={styles.input}
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button type="submit" className={styles.submitBtn}>
            {isSignup ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p className={styles.toggleText}>
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            className={styles.toggleBtn}
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
