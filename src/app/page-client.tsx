"use client";

import Link from "next/link";
import { useAuth } from "./providers";

export default function LandingPage() {
  const { user, profile, loading, signOut } = useAuth();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header className="app-header">
        <div className="container header-content">
          <div className="logo-group">
            <div className="logo-icon">I</div>
            <span>IntervueAI</span>
          </div>
          <nav className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            {loading ? (
              <span className="spinner" style={{ width: "20px", height: "20px" }}></span>
            ) : user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Link href="/dashboard" className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }}>
                  Dashboard
                </Link>
                <button onClick={signOut} className="btn btn-danger" style={{ padding: "0.5rem 1rem" }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "1rem" }}>
                <Link href="/login" className="nav-link" style={{ alignSelf: "center" }}>
                  Login
                </Link>
                <Link href="/signup" className="btn btn-primary" style={{ padding: "0.5rem 1rem" }}>
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: "8rem 0 6rem 0", textAlign: "center", position: "relative" }}>
        <div className="container animate-fade-in" style={{ maxWidth: "800px" }}>
          <div className="pulse-badge" style={{ marginBottom: "1.5rem" }}>
            Now in public beta v1.0
          </div>
          <h1 style={{ fontSize: "3.5rem", lineHeight: "1.2", marginBottom: "1.5rem", fontFamily: "var(--font-title)" }}>
            Ace Your Next Interview with <span className="gradient-text">Resume-Aware AI</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem", marginBottom: "2.5rem", fontWeight: "400" }}>
            Upload your resume and experience a realistic, interactive interview simulation.
            Get scored answer-by-answer in the background and receive an expert feedback report.
          </p>
          <div className="flex-center" style={{ gap: "1rem" }}>
            {user ? (
              <Link href="/dashboard" className="btn btn-primary" style={{ fontSize: "1.1rem", padding: "0.9rem 2rem" }}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/signup" className="btn btn-primary" style={{ fontSize: "1.1rem", padding: "0.9rem 2rem" }}>
                  Start Free Interview
                </Link>
                <a href="#features" className="btn btn-secondary" style={{ fontSize: "1.1rem", padding: "0.9rem 2rem" }}>
                  See How It Works
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: "6rem 0", background: "rgba(13, 17, 28, 0.3)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "2.2rem", marginBottom: "1rem" }}>Engineered for Realistic Practice</h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
              Generic questions don't prepare you for real interviews. IntervueAI studies your actual projects and experience gaps to ask precise, role-specific questions.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
            <div className="glass-panel glass-panel-hover" style={{ padding: "2.5rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📄</div>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "0.75rem" }}>Resume Deep Analysis</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Our AI system extracts your exact technical skills, projects, and work history to craft customized questions that interviewers will actually ask.
              </p>
            </div>

            <div className="glass-panel glass-panel-hover" style={{ padding: "2.5rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚡</div>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "0.75rem" }}>Continuous Async Scoring</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                No batch grading. While you write answer N+1, our background scoring engine evaluates answer N to display immediate grades and keep the flow seamless.
              </p>
            </div>

            <div className="glass-panel glass-panel-hover" style={{ padding: "2.5rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🏆</div>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "0.75rem" }}>Ideal-Answer References</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Every question is paired with a model 10/10 answer and specific reasoning, showing you exactly where you succeeded and what points you missed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: "auto", borderTop: "1px solid var(--border-glass)", padding: "2rem 0", background: "rgba(7, 9, 14, 0.8)", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>© 2026 IntervueAI. All rights reserved. Built for mona's project</div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/terms" className="nav-link" style={{ fontSize: "0.9rem" }}>Terms</Link>
            <Link href="/privacy" className="nav-link" style={{ fontSize: "0.9rem" }}>Privacy</Link>
            <Link href="/security" className="nav-link" style={{ fontSize: "0.9rem" }}>Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
