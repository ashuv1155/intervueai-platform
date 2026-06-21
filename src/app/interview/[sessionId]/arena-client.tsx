"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
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
  score?: number;
  scoringStatus: "pending" | "scoring" | "scored" | "failed";
}

export default function ArenaClient({ sessionId }: { sessionId: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Session Data States
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Interview Navigation States
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerInput, setAnswerInput] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Completion Loading State
  const [completing, setCompleting] = useState(false);
  const [completingStep, setCompletingStep] = useState("");

  const answerInputRef = useRef<HTMLTextAreaElement>(null);

  // 1. Fetch Session Metadata and verify permissions
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=/interview/${sessionId}`);
      return;
    }

    const fetchSession = async () => {
      try {
        const sessionRef = doc(db, "sessions", sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (!sessionSnap.exists()) {
          setError("Interview session not found.");
          setLoading(false);
          return;
        }

        const sessionData = sessionSnap.data();
        if (sessionData.userId !== user.uid) {
          setError("You do not have permission to view this session.");
          setLoading(false);
          return;
        }

        setSession(sessionData);

        if (sessionData.status === "completed") {
          router.push(`/interview/${sessionId}/report`);
          return;
        }

        // Fetch Questions
        const qRef = collection(db, "sessions", sessionId, "questions");
        const qQuery = query(qRef, orderBy("order", "asc"));
        const qSnapshot = await getDocs(qQuery);
        
        const fetchedQuestions: Question[] = [];
        qSnapshot.forEach((docSnap: any) => {
          fetchedQuestions.push(docSnap.data() as Question);
        });

        setQuestions(fetchedQuestions);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("An error occurred while loading this session.");
        setLoading(false);
      }
    };

    const getDocs = async (q: any) => {
      const snap = await getDocsDirectly(q);
      return snap;
    };

    // Helper for direct query snapshot
    const getDocsDirectly = async (queryRef: any) => {
      const { getDocs: getDocsFirestore } = await import("firebase/firestore");
      return await getDocsFirestore(queryRef);
    };

    fetchSession();
  }, [user, authLoading, sessionId, router]);

  // 2. Real-time Subscription to Answers (checks background scoring progress)
  useEffect(() => {
    if (!user || loading) return;

    const answersRef = collection(db, "sessions", sessionId, "answers");
    const unsubscribe = onSnapshot(answersRef, (snapshot) => {
      const updatedAnswers: Record<string, Answer> = {};
      snapshot.forEach((docSnap: any) => {
        const ans = docSnap.data();
        updatedAnswers[ans.questionId] = {
          id: docSnap.id,
          answerText: ans.answerText,
          score: ans.score,
          scoringStatus: ans.scoringStatus,
        };
      });
      setAnswers(updatedAnswers);
    });

    return () => unsubscribe();
  }, [user, loading, sessionId]);

  // Focus textarea when question changes
  useEffect(() => {
    if (!loading && questions[currentIdx]) {
      setAnswerInput("");
      setTimeout(() => {
        answerInputRef.current?.focus();
      }, 100);
    }
  }, [currentIdx, loading, questions]);

  // Handle Ctrl+Enter submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  // 3. Submit individual answer
  const handleSubmitAnswer = async () => {
    if (!answerInput.trim() || submittingAnswer) return;

    const activeQuestion = questions[currentIdx];
    const answerVal = answerInput;
    setSubmittingAnswer(true);

    try {
      // 1. Fire scoring API call in background (without waiting for scoring response)
      fetch("/api/session/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: activeQuestion.id,
          userAnswer: answerVal,
        }),
      }).catch((e) => console.error("Scoring fire failed:", e));

      // 2. Optimistically update local UI answers state
      setAnswers((prev) => ({
        ...prev,
        [activeQuestion.id]: {
          id: activeQuestion.id,
          answerText: answerVal,
          scoringStatus: "scoring",
        },
      }));

      // 3. Transition to next question
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
        setSubmittingAnswer(false);
      } else {
        // Last question submitted! Compile final report
        setSubmittingAnswer(false);
        handleCompleteInterview();
      }
    } catch (err) {
      console.error(err);
      setSubmittingAnswer(false);
    }
  };

  // 4. Trigger interview completion after all scoring is finished
  const handleCompleteInterview = async () => {
    setCompleting(true);
    setCompletingStep("Waiting for all answers to finish scoring...");

    // Wait until all questions have a matching answer document in Firestore marked 'scored' or 'failed'
    const checkScoringComplete = () => {
      return questions.every((q) => {
        const ans = answers[q.id];
        return ans && (ans.scoringStatus === "scored" || ans.scoringStatus === "failed");
      });
    };

    // Poll locally since onSnapshot updates the 'answers' state
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (checkScoringComplete()) {
        clearInterval(interval);
        compileReport();
      } else if (attempts > 30) {
        // Timeout (15 seconds) - Compile anyway, letting failed status stand
        clearInterval(interval);
        compileReport();
      } else {
        setCompletingStep(`Waiting for scoring... (${attempts}/30s)`);
      }
    }, 500);

    const compileReport = async () => {
      try {
        setCompletingStep("Synthesizing final evaluation report via our AI system...");
        const res = await fetch("/api/session/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (!res.ok) {
          throw new Error("Failed to compile final report");
        }

        router.push(`/interview/${sessionId}/report`);
      } catch (err) {
        console.error(err);
        setError("Failed to compile final session report.");
        setCompleting(false);
      }
    };
  };

  if (loading || authLoading) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", flexDirection: "column", gap: "1rem" }}>
        <span className="spinner" style={{ width: "40px", height: "40px" }}></span>
        <p style={{ color: "var(--text-secondary)" }}>Preparing interview environment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", flexDirection: "column", gap: "1rem", padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem" }}>🚨</div>
        <h2 style={{ color: "var(--danger)" }}>Error Loading Session</h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: "400px" }}>{error}</p>
        <Link href="/dashboard" className="btn btn-secondary" style={{ marginTop: "1rem" }}>
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (completing) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", flexDirection: "column", gap: "2rem", padding: "2rem", textAlign: "center" }}>
        <span className="spinner" style={{ width: "50px", height: "50px" }}></span>
        <div>
          <h2 style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>Generating Session Report</h2>
          <p style={{ color: "var(--primary)", fontWeight: "600", fontSize: "0.95rem" }}>{completingStep}</p>
        </div>
      </div>
    );
  }

  const activeQuestion = questions[currentIdx];

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: "3rem 1.5rem" }}>
        {/* Progress HUD */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>
              Question {currentIdx + 1} of {questions.length}
            </span>
            <h1 style={{ fontSize: "1.6rem", marginTop: "0.25rem" }}>Interview Arena</h1>
          </div>
          <span className="pulse-badge badge-scored">Live Session</span>
        </div>

        {/* Two-Column Workspace */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "2rem" }}>
          {/* Active Question Box & Text Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Question Panel */}
            <div className="glass-panel" style={{ padding: "2rem", position: "relative", minHeight: "120px" }}>
              <div style={{ position: "absolute", top: "1rem", right: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.03)", padding: "0.2rem 0.6rem", borderRadius: "4px" }}>
                Topic: {activeQuestion?.topic}
              </div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "500", marginTop: "1rem", lineHeight: "1.5" }}>
                {activeQuestion?.text}
              </h2>
            </div>

            {/* Answer Field */}
            <div className="glass-panel" style={{ padding: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignSelf: "center", marginBottom: "0.75rem" }}>
                <span className="form-label" style={{ margin: 0 }}>Your Answer</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Press Ctrl+Enter or Cmd+Enter to submit</span>
              </div>
              <textarea
                ref={answerInputRef}
                className="form-input"
                style={{ width: "100%", minHeight: "220px", resize: "vertical", fontFamily: "var(--font-family)", fontSize: "1rem", lineHeight: "1.6" }}
                placeholder="Type your detailed answer here... Tie it to your projects or skills listed on your resume."
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={submittingAnswer}
              ></textarea>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button
                  onClick={handleSubmitAnswer}
                  className="btn btn-primary"
                  style={{ minWidth: "160px", padding: "0.9rem 1.8rem" }}
                  disabled={!answerInput.trim() || submittingAnswer}
                >
                  {submittingAnswer ? (
                    <span className="spinner" style={{ width: "18px", height: "18px" }}></span>
                  ) : currentIdx === questions.length - 1 ? (
                    "Finish Interview"
                  ) : (
                    "Submit Answer"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Status Tracker */}
          <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h3 style={{ fontSize: "1rem", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
              Question Tracker
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto", maxHeight: "400px" }}>
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isActive = idx === currentIdx;
                
                let badgeClass = "pulse-badge";
                let statusText = "Upcoming";

                if (isActive) {
                  badgeClass = "pulse-badge badge-pending";
                  statusText = "Active";
                } else if (ans) {
                  if (ans.scoringStatus === "scored") {
                    badgeClass = "pulse-badge badge-scored";
                    statusText = `Scored: ${ans.score}/10`;
                  } else if (ans.scoringStatus === "scoring") {
                    badgeClass = "pulse-badge";
                    statusText = "Scoring...";
                  } else {
                    badgeClass = "pulse-badge badge-pending";
                    statusText = "Failed scoring";
                  }
                }

                return (
                  <div
                    key={q.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "8px",
                      background: isActive ? "rgba(99, 102, 241, 0.05)" : "transparent",
                      border: isActive ? "1px solid rgba(99, 102, 241, 0.2)" : "1px solid transparent",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", fontWeight: isActive ? "700" : "500", color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}>
                      Q{idx + 1}
                    </span>
                    <span className={badgeClass} style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem" }}>
                      {statusText}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div style={{ marginTop: "auto", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "10px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              🔑 <b>Tip:</b> While answering Question {currentIdx + 1}, our AI system is evaluating your previous answer in the background. Look for the score badges updating in real-time.
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
