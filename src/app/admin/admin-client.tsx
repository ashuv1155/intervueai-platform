"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, getDocs, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "../providers";
import Navbar from "@/components/Navbar";

interface UserRecord {
  uid: string;
  email: string;
  displayName: string;
  plan: string;
  role: string;
  interviewsThisMonth: number;
}

interface SessionRecord {
  id: string;
  status: string;
  overallScore: number;
  type: string;
}

export default function AdminClient() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // Data States
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Lock States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // System Config doc reference
  const configDocRef = doc(db, "adminConfig", "settings");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const unlocked = sessionStorage.getItem("admin_unlocked") === "true";
      setIsUnlocked(unlocked);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/admin");
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    if (!user || !isUnlocked) return;
    setDataLoading(true);
    try {
      // 1. Fetch Users
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList: UserRecord[] = [];
      usersSnap.forEach((docSnap: any) => {
        usersList.push(docSnap.data() as UserRecord);
      });
      setUsers(usersList);

      // 2. Fetch Sessions
      const sessionsSnap = await getDocs(collection(db, "sessions"));
      const sessionsList: SessionRecord[] = [];
      sessionsSnap.forEach((docSnap: any) => {
        sessionsList.push(docSnap.data() as SessionRecord);
      });
      setSessions(sessionsList);

      // 3. Fetch System Config
      const configSnap = await getDoc(configDocRef);
      if (configSnap.exists()) {
        setMaintenanceMode(configSnap.data().maintenanceMode || false);
      }
    } catch (err) {
      console.error("Error fetching admin stats:", err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user && isUnlocked) {
      fetchData();
    }
  }, [user, isUnlocked]);

  // Adjust User Plan
  const handleTogglePlan = async (targetUser: UserRecord) => {
    const nextPlan = targetUser.plan === "Pro" ? "Free" : "Pro";
    try {
      const userRef = doc(db, "users", targetUser.uid);
      await updateDoc(userRef, { plan: nextPlan });
      
      // Update local state
      setUsers(users.map(u => u.uid === targetUser.uid ? { ...u, plan: nextPlan } : u));
    } catch (err) {
      console.error("Failed to toggle plan:", err);
      alert("Failed to toggle plan.");
    }
  };

  // Adjust User Interviews Count
  const handleResetCredits = async (targetUser: UserRecord) => {
    try {
      const userRef = doc(db, "users", targetUser.uid);
      await updateDoc(userRef, { interviewsThisMonth: 0 });

      // Update local state
      setUsers(users.map(u => u.uid === targetUser.uid ? { ...u, interviewsThisMonth: 0 } : u));
    } catch (err) {
      console.error("Failed to reset credits:", err);
      alert("Failed to reset credits.");
    }
  };

  // Toggle Maintenance Mode flag
  const handleToggleMaintenance = async () => {
    const nextVal = !maintenanceMode;
    try {
      await setDoc(configDocRef, { maintenanceMode: nextVal }, { merge: true });
      setMaintenanceMode(nextVal);
    } catch (err) {
      console.error("Failed to toggle maintenance mode:", err);
      alert("Failed to toggle maintenance mode.");
    }
  };

  if (loading || (isUnlocked && dataLoading)) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", flexDirection: "column", gap: "1rem" }}>
        <span className="spinner" style={{ width: "40px", height: "40px" }}></span>
        <p style={{ color: "var(--text-secondary)" }}>Loading administrative records...</p>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <>
        <Navbar />
        <main className="flex-center" style={{ minHeight: "calc(100vh - 70px)", padding: "1.5rem" }}>
          <div className="glass-panel animate-fade-in" style={{ maxWidth: "450px", width: "100%", padding: "2.5rem 2rem", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Ambient light glow effect in background */}
            <div style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, var(--primary-glow) 0%, transparent 60%)",
              pointerEvents: "none",
              zIndex: 0
            }} />
            
            <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.8rem",
                color: "#fff",
                boxShadow: "var(--shadow-glow)",
                marginBottom: "1.25rem"
              }}>
                🔒
              </div>
              <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem", fontFamily: "var(--font-title)", fontWeight: 800 }}>
                Operations Control Gate
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                This console is restricted. Please enter the administration key to unlock Operations Control.
              </p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (password === "mona") {
                  sessionStorage.setItem("admin_unlocked", "true");
                  setIsUnlocked(true);
                  setErrorMsg("");
                } else {
                  setErrorMsg("Invalid administrative key. Access denied.");
                }
              }}
              style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                <label className="form-label" htmlFor="admin-key">Administrative Key</label>
                <input
                  id="admin-key"
                  type="password"
                  className="form-input"
                  placeholder="Enter access key..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  autoFocus
                  style={{
                    textAlign: "center",
                    letterSpacing: password ? "0.3em" : "normal",
                    fontSize: password ? "1.2rem" : "0.95rem",
                    border: errorMsg ? "1px solid var(--danger)" : "1px solid var(--border-glass)",
                    boxShadow: errorMsg ? "0 0 0 3px var(--danger-glow)" : undefined
                  }}
                />
              </div>

              {errorMsg && (
                <div style={{
                  color: "var(--danger)",
                  background: "var(--danger-glow)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  textAlign: "center",
                  fontWeight: "500"
                }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.85rem" }}>
                Unlock Dashboard
              </button>
            </form>
          </div>
        </main>
      </>
    );
  }

  // Calculate Metrics
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === "completed");
  const completedCount = completedSessions.length;
  const completionRate = totalSessions > 0 ? ((completedCount / totalSessions) * 100).toFixed(0) : "0";
  
  const avgOverallScore = completedCount > 0 
    ? (completedSessions.reduce((acc, curr) => acc + curr.overallScore, 0) / completedCount).toFixed(1)
    : "N/A";

  // Filter Users by Search
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: "3rem 1.5rem" }}>
        <div style={{ marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "2.2rem", marginBottom: "0.25rem" }}>Operations Control</h1>
          <p style={{ color: "var(--text-secondary)" }}>Monitor usage analytics, modify accounts, and handle flags</p>
        </div>

        {/* Analytics Section */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>Registered Users</span>
            <div style={{ fontSize: "2rem", fontWeight: "700", margin: "0.5rem 0" }}>{users.length}</div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Total accounts registered</p>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>Interviews Initiated</span>
            <div style={{ fontSize: "2rem", fontWeight: "700", margin: "0.5rem 0" }}>{totalSessions}</div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Mock sessions created</p>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>Completion Rate</span>
            <div style={{ fontSize: "2rem", fontWeight: "700", margin: "0.5rem 0", color: "var(--accent)" }}>{completionRate}%</div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{completedCount} of {totalSessions} completed</p>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>Platform Avg Score</span>
            <div style={{ fontSize: "2rem", fontWeight: "700", margin: "0.5rem 0" }}>{avgOverallScore} <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: "normal" }}>/ 10</span></div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Across all completed mock runs</p>
          </div>
        </div>

        {/* Lower Grid (User Management & Feature Flags) */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2.5rem" }}>
          {/* User Management */}
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <h2 style={{ fontSize: "1.3rem" }}>User Directory</h2>
              <input
                type="text"
                className="form-input"
                style={{ maxWidth: "250px", padding: "0.5rem 1rem" }}
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Name</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Email</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Plan</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Usage (Month)</th>
                    <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((targetUser) => (
                    <tr key={targetUser.uid} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: "600" }}>{targetUser.displayName}</td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>{targetUser.email}</td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span style={{
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          background: targetUser.plan === "Pro" ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.05)",
                          color: targetUser.plan === "Pro" ? "var(--primary)" : "var(--text-secondary)",
                        }}>
                          {targetUser.plan || "Free"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>{targetUser.interviewsThisMonth || 0} / 3</td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleTogglePlan(targetUser)}
                            className="btn btn-secondary"
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                          >
                            Toggle {targetUser.plan === "Pro" ? "Free" : "Pro"}
                          </button>
                          <button
                            onClick={() => handleResetCredits(targetUser)}
                            className="btn btn-danger"
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                          >
                            Reset Credits
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Config Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* System Configuration */}
            <div className="glass-panel" style={{ padding: "2rem" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "1.25rem" }}>System Config</h3>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>Maintenance Banner</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Notify users of pending works</div>
                </div>
                <button
                  onClick={handleToggleMaintenance}
                  className={maintenanceMode ? "btn btn-danger" : "btn btn-secondary"}
                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                >
                  {maintenanceMode ? "Disable" : "Enable"}
                </button>
              </div>

              <div style={{ padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>Active Settings Status</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className={`pulse-badge ${maintenanceMode ? "badge-pending" : "badge-scored"}`} style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem" }}>
                    {maintenanceMode ? "Maintenance On" : "System Healthy"}
                  </span>
                </div>
              </div>
            </div>

            {/* Model Info */}
            <div className="glass-panel" style={{ padding: "2rem" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>AI Pipeline Specs</h3>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Active Model:</span>{" "}
                  <code style={{ background: "rgba(255,255,255,0.05)", padding: "0.15rem 0.3rem", borderRadius: "4px" }}>AI 2.5-flash</code>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Response Mode:</span>{" "}
                  <code style={{ background: "rgba(255,255,255,0.05)", padding: "0.15rem 0.3rem", borderRadius: "4px" }}>application/json</code>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Target region:</span>{" "}
                  <code style={{ background: "rgba(255,255,255,0.05)", padding: "0.15rem 0.3rem", borderRadius: "4px" }}>us-central1</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
