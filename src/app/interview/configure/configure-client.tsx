"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import Navbar from "@/components/Navbar";

export default function ConfigureClient() {
  const { user, profile, refreshProfile, loading } = useAuth();
  const router = useRouter();

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Configuration States
  const [interviewType, setInterviewType] = useState("Technical");
  const [customRole, setCustomRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [duration, setDuration] = useState("30");
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [generationError, setGenerationError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/interview/configure");
    }
  }, [user, loading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 5 * 1024 * 1024) {
        setUploadError("File exceeds 5MB size limit.");
        setFile(null);
        return;
      }
      if (!selected.name.endsWith(".pdf") && !selected.name.endsWith(".docx")) {
        setUploadError("Invalid file type. Please upload a PDF or DOCX file.");
        setFile(null);
        return;
      }
      setUploadError("");
      setFile(selected);
    }
  };

  const handleUploadResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setUploading(true);
    setUploadError("");
    
    try {
      setUploadStep("1. Connecting to parsing server...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.uid);

      setUploadStep("2. Sending resume file to AI parser...");
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse resume");
      }

      setUploadStep("3. Saving parsed resume structure...");
      await refreshProfile();
      setUploading(false);
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "An error occurred during upload.");
      setUploading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!user || !profile?.activeResumeId) return;

    setGenerating(true);
    setGenerationError("");
    
    const selectedType = interviewType === "Custom" ? `Role-specific (${customRole || "Specialist"})` : interviewType;

    try {
      setGenerationStep("1. Initializing session configurations...");
      setGenerationStep("2. Prompts loaded, querying AI for custom questions...");
      
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          resumeId: profile.activeResumeId,
          type: selectedType,
          difficulty,
          durationMinutes: Number(duration),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate interview");
      }

      setGenerationStep("3. Committing questions to storage and preparing arena...");
      router.push(`/interview/${data.session.id}`);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Failed to generate questions. Please try again.");
      setGenerating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", flexDirection: "column", gap: "1rem" }}>
        <span className="spinner" style={{ width: "40px", height: "40px" }}></span>
        <p style={{ color: "var(--text-secondary)" }}>Verifying session...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: "3rem 1.5rem", maxWidth: "800px" }}>
        {generating ? (
          <div className="glass-panel flex-center animate-fade-in" style={{ padding: "4rem 2rem", flexDirection: "column", gap: "2rem", minHeight: "400px" }}>
            <span className="spinner" style={{ width: "50px", height: "50px" }}></span>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>Generating Your Mock Interview</h2>
              <p style={{ color: "var(--primary)", fontWeight: "600", fontSize: "0.95rem", marginBottom: "0.5rem" }}>{generationStep}</p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Our AI system is studying your resume to prepare customized questions. This will take ~10-15 seconds.</p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h1 style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>Configure Your Interview</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "3.5rem" }}>Prepare settings and customize the simulation</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Resume Status / Upload Section */}
              <div className="glass-panel" style={{ padding: "2.5rem" }}>
                <h2 style={{ fontSize: "1.3rem", marginBottom: "1.5rem" }}>1. Resume Selection</h2>
                
                {profile?.resumeUploaded ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(99, 102, 241, 0.05)", border: "1px solid var(--border-glass)", padding: "1rem 1.5rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontSize: "2rem" }}>📄</span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>Active Resume Attached</span>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Interviews will be generated based on this document</span>
                        </div>
                      </div>
                      <span className="pulse-badge badge-scored">Active</span>
                    </div>

                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1rem" }}>Want to use a different resume? Upload a new one below:</p>
                  </div>
                ) : (
                  <div style={{ background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.15)", padding: "1rem 1.5rem", borderRadius: "12px", color: "var(--warning)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                    ⚠️ An uploaded resume is required before configuring interview settings. Please upload a PDF or DOCX file (Max 5MB).
                  </div>
                )}

                {/* File Upload Form */}
                <form onSubmit={handleUploadResume}>
                  <div style={{
                    border: "2px dashed var(--border-glass)",
                    borderRadius: "12px",
                    padding: "2rem",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "rgba(13, 17, 28, 0.3)",
                    transition: "var(--transition-fast)",
                    position: "relative",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--border-glass)"}
                  >
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        cursor: "pointer",
                      }}
                      disabled={uploading}
                    />
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📤</div>
                    <p style={{ fontWeight: "600", fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                      {file ? file.name : "Drag & drop or click to upload resume"}
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Supports PDF or DOCX formats up to 5MB</p>
                  </div>

                  {uploadError && (
                    <p style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "0.75rem" }}>{uploadError}</p>
                  )}

                  {file && (
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: "100%", marginTop: "1.5rem" }}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span className="spinner" style={{ width: "18px", height: "18px" }}></span>
                          <span>{uploadStep}</span>
                        </div>
                      ) : (
                        "Upload and Parse Resume"
                      )}
                    </button>
                  )}
                </form>
              </div>

              {/* Settings Configuration Section */}
              {profile?.resumeUploaded && (
                <div className="glass-panel animate-fade-in" style={{ padding: "2.5rem" }}>
                  <h2 style={{ fontSize: "1.3rem", marginBottom: "1.5rem" }}>2. Interview Configurations</h2>
                  
                  {generationError && (
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--danger)", padding: "0.75rem 1rem", borderRadius: "10px", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                      {generationError}
                    </div>
                  )}

                  {/* Interview Type */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="type">Interview Type</label>
                    <select
                      id="type"
                      className="form-input form-select"
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value)}
                    >
                      <option value="Technical">Technical (Coding, System Design, Tech Stack)</option>
                      <option value="HR/Behavioral">HR / Behavioral (STAR Method, Collaboration)</option>
                      <option value="Managerial">Managerial (Leadership, Delivery, Planning)</option>
                      <option value="Custom">Custom Role (Specify custom role target)</option>
                    </select>
                  </div>

                  {/* Custom Role Input */}
                  {interviewType === "Custom" && (
                    <div className="form-group animate-fade-in">
                      <label className="form-label" htmlFor="custom-role">Target Role Name</label>
                      <input
                        id="custom-role"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Senior Frontend Engineer"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {/* Difficulty & Duration Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="difficulty">Difficulty Level</label>
                      <select
                        id="difficulty"
                        className="form-input form-select"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                      >
                        <option value="Easy">Easy (Lighter scoring & conceptual questions)</option>
                        <option value="Medium">Medium (Balanced case questions)</option>
                        <option value="Hard">Hard (Strict grading & complex system analysis)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="duration">Interview Duration</label>
                      <select
                        id="duration"
                        className="form-input form-select"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      >
                        <option value="15">15 Minutes (~4 questions)</option>
                        <option value="30">30 Minutes (~8 questions)</option>
                        <option value="45">45 Minutes (~12 questions)</option>
                        <option value="60">60 Minutes (~15 questions)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleStartInterview}
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: "1.5rem", fontSize: "1.05rem", padding: "1rem" }}
                  >
                    🚀 Begin Mock Interview
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
