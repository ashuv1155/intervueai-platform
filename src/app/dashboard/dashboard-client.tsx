"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "../providers";
import Navbar from "@/components/Navbar";

interface Session {
  id: string;
  type: string;
  difficulty: string;
  durationMinutes: number;
  status: string;
  overallScore: number;
  createdAt: string;
}

export default function DashboardClient() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchSessions = async () => {
      try {
        const sessionsRef = collection(db, "sessions");
        const q = query(
          sessionsRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedSessions: Session[] = [];
        querySnapshot.forEach((doc: any) => {
          fetchedSessions.push(doc.data() as Session);
        });
        setSessions(fetchedSessions);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", flexDirection: "column", gap: "1rem" }}>
        <span className="spinner" style={{ width: "40px", height: "40px" }}></span>
        <p style={{ color: "var(--text-secondary)" }}>Verifying session...</p>
      </div>
    );
  }

  // Calculate Metrics
  const completedSessions = sessions.filter(s => s.status === "completed");
  const totalCompleted = completedSessions.length;
  const averageScore = totalCompleted > 0
    ? (completedSessions.reduce((acc, curr) => acc + curr.overallScore, 0) / totalCompleted).toFixed(1)
    : "N/A";

  // Generate SVG Sparkline Points for completed sessions (in chronological order)
  const scoresOverTime = [...completedSessions]
    .reverse()
    .map(s => s.overallScore);

  const getSparklinePoints = (scores: number[]) => {
    if (scores.length < 2) return "";
    const width = 300;
    const height = 60;
    const maxVal = 10;
    const minVal = 0;
    const padding = 5;

    const points = scores.map((val, idx) => {
      const x = padding + (idx / (scores.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - minVal) / (maxVal - minVal)) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(" ");

    return points;
  };

  const sparklinePoints = getSparklinePoints(scoresOverTime);

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: "3rem 1.5rem" }}>
        {/* Dashboard Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "3rem" }}>
          <div>
            <h1 style={{ fontSize: "2.2rem", marginBottom: "0.25rem" }}>Candidate Dashboard</h1>
            <p style={{ color: "var(--text-secondary)" }}>Prepare and monitor your interview readiness metrics</p>
          </div>
          {profile?.resumeUploaded ? (
            <Link href="/interview/configure" className="btn btn-primary" style={{ padding: "0.9rem 1.8rem" }}>
              Start New Interview
            </Link>
          ) : (
            <Link href="/interview/configure" className="btn btn-primary" style={{ padding: "0.9rem 1.8rem" }}>
              Upload Resume to Begin
            </Link>
          )}
        </div>

        {/* Metrics Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>Monthly Limit</span>
            <div style={{ fontSize: "1.8rem", fontWeight: "700", margin: "0.5rem 0" }}>
              {profile?.plan === "Pro" ? "Unlimited" : `${profile?.interviewsThisMonth || 0} / 3`}
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              {profile?.plan === "Pro" ? "Priority AI pricing tier active" : "Free tier resets monthly"}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>Interviews Done</span>
            <div style={{ fontSize: "1.8rem", fontWeight: "700", margin: "0.5rem 0" }}>{totalCompleted}</div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Completed structured mock sessions</p>
          </div>

          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>Average Score</span>
            <div style={{ fontSize: "1.8rem", fontWeight: "700", margin: "0.5rem 0", color: totalCompleted > 0 ? "var(--primary)" : "var(--text-primary)" }}>
              {averageScore} <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: "normal" }}>/ 10</span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Based on AI evaluations</p>
          </div>

          <div className="glass-panel" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>Score Trend</span>
            {scoresOverTime.length >= 2 ? (
              <div style={{ height: "60px", display: "flex", alignItems: "flex-end" }}>
                <svg width="100%" height="100%" viewBox="0 0 300 60" style={{ overflow: "visible" }}>
                  <polyline
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    points={sparklinePoints}
                  />
                  {/* Dots for points */}
                  {scoresOverTime.map((val, idx) => {
                    const width = 300;
                    const height = 60;
                    const padding = 5;
                    const x = padding + (idx / (scoresOverTime.length - 1)) * (width - 2 * padding);
                    const y = height - padding - ((val - 0) / (10 - 0)) * (height - 2 * padding);
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="var(--accent)"
                      />
                    );
                  })}
                </svg>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.5rem 0" }}>Need at least 2 reports to plot trends</p>
            )}
          </div>
        </div>

        {/* Dashboard Layout Body */}
        <div className="dashboard-grid">
          {/* Interview History */}
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "1.5rem" }}>Interview History</h2>
            
            {sessionsLoading ? (
              <div className="flex-center" style={{ padding: "4rem 0" }}>
                <span className="spinner"></span>
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-secondary)" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎓</div>
                <h3 style={{ marginBottom: "0.5rem" }}>No interviews yet</h3>
                <p style={{ fontSize: "0.9rem", marginBottom: "1.5rem" }}>Configure and start your first resume-tailored session to begin practicing.</p>
                <Link href="/interview/configure" className="btn btn-primary" style={{ padding: "0.6rem 1.2rem" }}>
                  Configure Interview
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                      <th style={{ padding: "1rem 0.5rem" }}>Date</th>
                      <th style={{ padding: "1rem 0.5rem" }}>Type</th>
                      <th style={{ padding: "1rem 0.5rem" }}>Difficulty</th>
                      <th style={{ padding: "1rem 0.5rem" }}>Duration</th>
                      <th style={{ padding: "1rem 0.5rem" }}>Score</th>
                      <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id} style={{ borderBottom: "1px solid var(--border-glass)", fontSize: "0.95rem" }}>
                        <td style={{ padding: "1rem 0.5rem" }}>
                          {new Date(session.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td style={{ padding: "1rem 0.5rem" }}>{session.type}</td>
                        <td style={{ padding: "1rem 0.5rem" }}>
                          <span style={{
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            background: session.difficulty === "Hard" ? "rgba(239, 68, 68, 0.1)" : session.difficulty === "Medium" ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                            color: session.difficulty === "Hard" ? "var(--danger)" : session.difficulty === "Medium" ? "var(--warning)" : "var(--success)",
                          }}>
                            {session.difficulty}
                          </span>
                        </td>
                        <td style={{ padding: "1rem 0.5rem" }}>{session.durationMinutes} min</td>
                        <td style={{ padding: "1rem 0.5rem", fontWeight: "700" }}>
                          {session.status === "completed" ? (
                            <span style={{ color: session.overallScore >= 7.5 ? "var(--success)" : session.overallScore >= 5.0 ? "var(--warning)" : "var(--danger)" }}>
                              {session.overallScore} / 10
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.85rem" }}>
                              {session.status === "in_progress" ? "In Progress" : "Abandoned"}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                          {session.status === "completed" ? (
                            <Link href={`/interview/${session.id}/report`} className="btn btn-secondary" style={{ padding: "0.35rem 0.85rem", fontSize: "0.8rem" }}>
                              View Report
                            </Link>
                          ) : session.status === "in_progress" ? (
                            <Link href={`/interview/${session.id}`} className="btn btn-primary" style={{ padding: "0.35rem 0.85rem", fontSize: "0.8rem" }}>
                              Resume
                            </Link>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Abandoned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Resume Management Side Card */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="glass-panel" style={{ padding: "2rem" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Resume Status</h3>
              {profile?.resumeUploaded ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.1)", padding: "0.75rem 1rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>📄</span>
                    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      <span style={{ fontWeight: "600", fontSize: "0.9rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>Resume Linked</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Ready for mock interviews</span>
                    </div>
                  </div>
                  <Link href="/interview/configure" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                    Update Resume
                  </Link>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                    You have not uploaded a resume yet. An uploaded resume is required before initiating an AI interview.
                  </p>
                  <Link href="/interview/configure" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                    Upload Resume
                  </Link>
                </div>
              )}
            </div>

            <div className="glass-panel" style={{ padding: "2rem", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Tips for Mocking</h3>
              <ul style={{ paddingLeft: "1.2rem", color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <li>Be specific and use real numbers or projects from your resume.</li>
                <li>Write clear, structured responses using paragraphs.</li>
                <li>Try different difficulties to test your boundaries (Hard scores strictly).</li>
                <li>Review the "Ideal Answer" critiques to learn missing industry points.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
