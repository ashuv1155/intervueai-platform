import { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy | IntervueAI",
  description: "Understand how IntervueAI collects, uses, and secures your personal information, resume text, and interview transcripts.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="container animate-fade-in" style={{ padding: "4rem 1.5rem", maxWidth: "800px" }}>
        <Link href="/" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "1.5rem" }}>
          ← Back to Home
        </Link>
        <article className="glass-panel" style={{ padding: "3.5rem" }}>
          <h1 style={{ fontSize: "2.4rem", marginBottom: "0.5rem" }}>Privacy Policy</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "2.5rem" }}>Last Updated: June 21, 2026</p>

          <section style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", color: "var(--accent)" }}>1. Information We Collect</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                We collect information that you explicitly share during registration and usage:
              </p>
              <ul style={{ paddingLeft: "1.25rem", marginTop: "0.5rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.95rem" }}>
                <li><b>Profile Data</b>: Name, email address, profile picture (via Google Auth), and plan settings.</li>
                <li><b>Resume Files</b>: PDF and DOCX documents containing your skills, projects, and work history.</li>
                <li><b>Simulation Logs</b>: Custom configurations, typed mock replies, scoring history, and final feedback summaries.</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", color: "var(--accent)" }}>2. How We Use Your Information</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                We process your information exclusively to support your prep workflow:
              </p>
              <ul style={{ paddingLeft: "1.25rem", marginTop: "0.5rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.95rem" }}>
                <li>To parse resume files and identify specific technical and behavioral target roles.</li>
                <li>To feed questions and scoring criteria to our secure background AI evaluation model.</li>
                <li>To maintain your session history, dashboard trend graphs, and final reports.</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", color: "var(--accent)" }}>3. Data Security & Storage</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                All credentials, profile data, and session details are stored securely within Firebase (Auth, Firestore, and Storage). Access to your files is protected by Firestore Rules to guarantee that only you (or the system admin) can query your resume or scoring data.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", color: "var(--accent)" }}>4. AI Processing Pipeline</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                To generate custom questions and score answers, resume snippets and typed replies are securely processed through our back-end AI engine. The prompt context is not cached permanently for training, ensuring your intellectual property remains private.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", color: "var(--accent)" }}>5. User Rights & Deletion</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                You have full control over your data. You can delete uploaded resumes at any time through your Candidate Dashboard, which will wipe the file from Firebase Storage. To request a complete deletion of your account and session history, please contact our support team.
              </p>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}
