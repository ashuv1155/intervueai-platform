"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/app/providers";
import Navbar from "@/components/Navbar";

interface Question {
  id: string;
  text: string;
  topic: string;
  order: number;
}

interface Answer {
  id: string;
  answerText: string;
  score: number;
  rationale: string;
  idealAnswer: string;
}

export default function ReportClient({ sessionId }: { sessionId: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>("q_1");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=/interview/${sessionId}/report`);
      return;
    }

    const fetchReportData = async () => {
      try {
        const sessionRef = doc(db, "sessions", sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (!sessionSnap.exists()) {
          setError("Interview session report not found.");
          setLoading(false);
          return;
        }

        const sessionData = sessionSnap.data();
        if (sessionData.userId !== user.uid) {
          setError("You do not have permission to view this report.");
          setLoading(false);
          return;
        }

        setSession(sessionData);

        // Fetch Questions
        const qRef = collection(db, "sessions", sessionId, "questions");
        const qQuery = query(qRef, orderBy("order", "asc"));
        const qSnapshot = await getDocs(qQuery);
        const fetchedQuestions: Question[] = [];
        qSnapshot.forEach((docSnap: any) => {
          fetchedQuestions.push(docSnap.data() as Question);
        });
        setQuestions(fetchedQuestions);

        // Fetch Answers
        const answersRef = collection(db, "sessions", sessionId, "answers");
        const answersSnapshot = await getDocs(answersRef);
        const fetchedAnswers: Record<string, Answer> = {};
        answersSnapshot.forEach((docSnap: any) => {
          const ans = docSnap.data();
          fetchedAnswers[ans.questionId] = {
            id: docSnap.id,
            answerText: ans.answerText,
            score: ans.score,
            rationale: ans.rationale,
            idealAnswer: ans.idealAnswer,
          };
        });
        setAnswers(fetchedAnswers);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("An error occurred while loading this report.");
        setLoading(false);
      }
    };

    fetchReportData();
  }, [user, authLoading, sessionId, router]);

  const toggleAccordion = (qId: string) => {
    if (expandedQuestion === qId) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(qId);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", flexDirection: "column", gap: "1rem" }}>
        <span className="spinner" style={{ width: "40px", height: "40px" }}></span>
        <p style={{ color: "var(--text-secondary)" }}>Compiling report data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", flexDirection: "column", gap: "1rem", padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem" }}>🚨</div>
        <h2 style={{ color: "var(--danger)" }}>Error Loading Report</h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: "400px" }}>{error}</p>
        <Link href="/dashboard" className="btn btn-secondary" style={{ marginTop: "1rem" }}>
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const scoreColor = session.overallScore >= 7.5 ? "var(--success)" : session.overallScore >= 5.0 ? "var(--warning)" : "var(--danger)";
  const readinessText = session.overallScore >= 7.5 ? "Strong Preparedness" : session.overallScore >= 5.0 ? "Developing" : "Needs Review";

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: "3rem 1.5rem" }}>
        {/* Breadcrumb & Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <Link href="/dashboard" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
            ← Back to Dashboard
          </Link>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>
                Session Feedback Report
              </span>
              <h1 style={{ fontSize: "2.2rem", marginTop: "0.25rem" }}>{session.type} Mock Interview</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: "0.4rem" }}>
                Completed on {new Date(session.completedAt || session.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div className="user-badge" style={{ padding: "0.5rem 1rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Difficulty:</span>
                <span style={{ fontWeight: "600" }}>{session.difficulty}</span>
              </div>
              <div className="user-badge" style={{ padding: "0.5rem 1rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Duration:</span>
                <span style={{ fontWeight: "600" }}>{session.durationMinutes} min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary Panel */}
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "2.5rem", marginBottom: "3rem" }}>
          {/* Large Score Circular Display */}
          <div className="glass-panel flex-center" style={{ padding: "2.5rem", flexDirection: "column", textAlign: "center" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase", marginBottom: "1.5rem" }}>Overall Score</span>
            <div style={{
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              border: `6px solid ${scoreColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5rem",
              fontWeight: "800",
              color: scoreColor,
              boxShadow: `0 0 20px ${scoreColor}20`,
              marginBottom: "1rem"
            }}>
              {session.overallScore}
            </div>
            <span style={{ fontWeight: "700", fontSize: "1.1rem" }}>{readinessText}</span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Graded out of 10 points</span>
          </div>

          {/* Coach Feedback Narrative */}
          <div className="glass-panel" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>AI Career Coach Summary</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.7", whiteSpace: "pre-line" }}>
              {session.summary?.overallFeedback}
            </p>
          </div>
        </div>

        {/* Strengths & Weaknesses Grids */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", marginBottom: "4rem" }}>
          {/* Strengths Card */}
          <div className="glass-panel" style={{ padding: "2rem", borderTop: "4px solid var(--success)" }}>
            <h3 style={{ fontSize: "1.2rem", color: "var(--success)", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <span>✓</span> Key Strengths
            </h3>
            <ul style={{ display: "flex", flexDirection: "column", gap: "1rem", listStyle: "none" }}>
              {session.summary?.strengths?.map((strength: string, idx: number) => (
                <li key={idx} style={{ display: "flex", gap: "0.75rem", fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--success)", fontWeight: "bold" }}>•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses Card */}
          <div className="glass-panel" style={{ padding: "2rem", borderTop: "4px solid var(--danger)" }}>
            <h3 style={{ fontSize: "1.2rem", color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <span>⚠️</span> Areas for Improvement
            </h3>
            <ul style={{ display: "flex", flexDirection: "column", gap: "1rem", listStyle: "none" }}>
              {session.summary?.weaknesses?.map((weakness: string, idx: number) => (
                <li key={idx} style={{ display: "flex", gap: "0.75rem", fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--danger)", fontWeight: "bold" }}>•</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Detailed Question Breakdown (Accordion) */}
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Question-by-Question Breakdown</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {questions.map((q, idx) => {
            const ans = answers[q.id];
            const isExpanded = expandedQuestion === q.id;

            if (!ans) return null;

            return (
              <div
                key={q.id}
                className="glass-panel"
                style={{
                  overflow: "hidden",
                  borderColor: isExpanded ? "var(--primary-glow)" : "var(--border-glass)",
                  boxShadow: isExpanded ? "var(--shadow-md)" : "none",
                }}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleAccordion(q.id)}
                  style={{
                    padding: "1.25rem 2rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    background: isExpanded ? "rgba(99, 102, 241, 0.03)" : "transparent",
                    transition: "var(--transition-fast)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flex: 1, marginRight: "1rem" }}>
                    <span style={{
                      fontWeight: "700",
                      fontSize: "1.1rem",
                      color: "var(--text-muted)",
                      minWidth: "30px"
                    }}>
                      {idx + 1}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "var(--text-primary)", fontWeight: "600", fontSize: "1rem" }}>{q.text}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.2rem" }}>Probing topic: {q.topic}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <span style={{
                      fontSize: "1rem",
                      fontWeight: "700",
                      color: ans.score >= 7.5 ? "var(--success)" : ans.score >= 5.0 ? "var(--warning)" : "var(--danger)",
                      background: ans.score >= 7.5 ? "var(--success-glow)" : ans.score >= 5.0 ? "var(--warning-glow)" : "var(--danger-glow)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "6px",
                      border: `1px solid ${ans.score >= 7.5 ? "rgba(16, 185, 129, 0.2)" : ans.score >= 5.0 ? "rgba(245, 158, 11, 0.2)" : "rgba(239, 68, 68, 0.2)"}`
                    }}>
                      {ans.score} / 10
                    </span>
                    <span style={{ fontSize: "1.2rem", transition: "var(--transition-fast)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", color: "var(--text-muted)" }}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div style={{
                    padding: "2rem",
                    borderTop: "1px solid var(--border-glass)",
                    background: "rgba(7, 9, 14, 0.3)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem"
                  }}>
                    {/* Candidate Answer */}
                    <div>
                      <h4 style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Your Answer</h4>
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-glass)", padding: "1rem 1.25rem", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>
                        {ans.answerText}
                      </div>
                    </div>

                    {/* Critique / Rationale */}
                    <div>
                      <h4 style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Coach Rationale</h4>
                      <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                        {ans.rationale}
                      </p>
                    </div>

                    {/* Ideal Answer */}
                    <div>
                      <h4 style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Ideal Reference Answer</h4>
                      <div style={{ background: "rgba(20, 184, 166, 0.03)", border: "1px solid rgba(20, 184, 166, 0.15)", padding: "1.25rem 1.5rem", borderRadius: "8px", color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: "1.6", borderLeft: "4px solid var(--accent)" }}>
                        {ans.idealAnswer}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
