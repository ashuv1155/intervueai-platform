"use client";

import Link from "next/link";
import { useAuth } from "@/app/providers";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Navbar() {
  const { user, profile, loading, signOut, isAdmin } = useAuth();
  const pathname = usePathname();
  const [maintenance, setMaintenance] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Subscribe to maintenance banner config
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "adminConfig", "settings"), (docSnap) => {
      if (docSnap.exists()) {
        setMaintenance(docSnap.data().maintenanceMode || false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync theme state on mount
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme") as "dark" | "light" || "dark";
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  };

  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <>
      {maintenance && (
        <div style={{ background: "linear-gradient(90deg, #b91c1c 0%, #7f1d1d 100%)", color: "white", textAlign: "center", padding: "0.4rem 1rem", fontSize: "0.8rem", fontWeight: "600", letterSpacing: "0.02em", borderBottom: "1px solid rgba(255,255,255,0.1)", zIndex: 101, position: "relative" }}>
          🔧 SYSTEM ALERT: Platform maintenance in progress. Some AI feedback results may be slightly delayed.
        </div>
      )}
      <header className="app-header">
        <div className="container header-content">
          <Link href="/" className="logo-group">
            <div className="logo-icon">I</div>
            <span>IntervueAI</span>
          </Link>
          <nav className="nav-links">
            <button
              onClick={toggleTheme}
              style={{
                width: "36px",
                height: "36px",
                fontSize: "1.1rem",
                borderRadius: "10px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border-glass)",
                background: "var(--bg-badge)",
                cursor: "pointer",
                padding: "0",
                flexShrink: 0,
                color: "var(--text-primary)",
                transition: "var(--transition-fast)",
              }}
              aria-label="Toggle theme"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {loading ? (
              <span className="spinner" style={{ width: "20px", height: "20px" }}></span>
            ) : user ? (
              <>
                <Link href="/dashboard" className="nav-link" style={{ color: pathname === "/dashboard" ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  Dashboard
                </Link>

                <div className="user-badge">
                  <div className="user-avatar">{getInitials(profile?.displayName || user.displayName || user.email || "")}</div>
                  <div style={{ display: "flex", flexDirection: "column", fontSize: "0.8rem", lineHeight: "1.2" }}>
                    <span style={{ fontWeight: "600" }}>{profile?.displayName || user.displayName || "User"}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{profile?.plan || "Free"} Plan</span>
                  </div>
                </div>
                <button onClick={signOut} className="btn btn-danger" style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-link">
                  Login
                </Link>
                <Link href="/signup" className="btn btn-primary" style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}>
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
