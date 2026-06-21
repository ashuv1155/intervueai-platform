import { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Terms of Service | IntervueAI",
  description: "Read the Terms of Service for using the IntervueAI mock interview platform. Understand your rights and usage limitations.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="container animate-fade-in" style={{ padding: "4rem 1.5rem", maxWidth: "800px" }}>
        <Link href="/" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "1.5rem" }}>
          ← Back to Home
        </Link>
        <article className="glass-panel" style={{ padding: "3.5rem" }}>
          <h1 style={{ fontSize: "2.4rem", marginBottom: "0.5rem" }}>Terms of Service</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "2.5rem" }}>Last Updated: June 21, 2026</p>

          <section style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", color: "var(--primary)" }}>1. Agreement to Terms</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                By accessing or using IntervueAI (the "Platform"), you agree to be bound by these Terms of Service. If you do not agree to all of the terms and conditions, you are prohibited from using the Platform.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", color: "var(--primary)" }}>2. Description of Service</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                IntervueAI is an interactive simulator designed to help candidates prepare for interviews by analyzing their uploaded resume and generating customized mock interview questions. All answers are graded in the background by our secure AI pipeline.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", color: "var(--primary)" }}>3. User Accounts and Security</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                You must register an account using Email/Password or Google Authentication to use Platform features. You are responsible for safeguarding your credentials. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", color: "var(--primary)" }}>4. Resume Uploads & AI Parsing</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                You retain ownership of all resumes, files, and content you upload to the Platform. By uploading, you grant IntervueAI a license to process the document text through our local AI pipeline and extract structural information solely to generate your interview configurations.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", color: "var(--primary)" }}>5. Subscription Plans & Mock Payments</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                Free tier accounts are limited to three interview sessions per month. Users may upgrade to the Pro plan via our mock payment checkout interface. Any payment details provided are strictly for simulation purposes and will not result in actual monetary transactions.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", color: "var(--primary)" }}>6. Prohibited Activities</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                You agree not to bypass authentication, attempt to overload the AI pipeline, scrape content, upload malicious code, or distribute falsified resume records. Violation of system safety rules will result in immediate account suspension.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", color: "var(--primary)" }}>7. Limitation of Liability</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.7" }}>
                IntervueAI provides evaluation metrics and ideal answers for educational purposes. We make no guarantees that mock interview results will correlate with real-world job placements or hiring outcomes.
              </p>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}
