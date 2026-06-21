"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "../providers";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push(redirectUrl);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.message || "Failed to log in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push(redirectUrl);
    } catch (err: any) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Failed to log in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ width: "100%", maxWidth: "440px", padding: "3rem 2.5rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div className="logo-icon" style={{ margin: "0 auto 1rem auto", width: "40px", height: "40px" }}>I</div>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Welcome Back</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Sign in to continue practicing</p>
      </div>

      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--danger)", padding: "0.75rem 1rem", borderRadius: "10px", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleEmailLogin}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            className="form-input"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label className="form-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", marginBottom: "1.5rem" }}
          disabled={loading}
        >
          {loading ? <span className="spinner" style={{ width: "20px", height: "20px" }}></span> : "Sign In with Email"}
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", margin: "1.5rem 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
        <div style={{ flex: 1, height: "1px", background: "var(--border-glass)" }}></div>
        <span style={{ padding: "0 0.75rem" }}>OR</span>
        <div style={{ flex: 1, height: "1px", background: "var(--border-glass)" }}></div>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="btn btn-secondary"
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "2rem" }}
        disabled={loading}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-5.28-4.53z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
        Don't have an account?{" "}
        <Link href="/signup" style={{ fontWeight: "600" }}>
          Sign Up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPageClient() {
  return (
    <div className="flex-center" style={{ minHeight: "100vh", padding: "2rem" }}>
      <Suspense fallback={
        <div className="flex-center" style={{ flexDirection: "column", gap: "1rem" }}>
          <span className="spinner" style={{ width: "40px", height: "40px" }}></span>
          <p style={{ color: "var(--text-secondary)" }}>Loading login form...</p>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}
