import { Metadata } from "next";
import LandingPage from "./page-client";

export const metadata: Metadata = {
  title: "IntervueAI - AI Resume-Based Mock Interview Platform",
  description: "Ace your next job interview. Upload your resume and practice with customized questions, real-time feedback, and scoring based on your actual experience.",
  openGraph: {
    title: "IntervueAI - AI Resume-Based Mock Interview Platform",
    description: "Upload your resume and practice mock interviews tailored to your experience, with real-time feedback and scoring.",
    type: "website",
    url: "https://intervueai.com",
    siteName: "IntervueAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "IntervueAI - AI Resume-Based Mock Interview Platform",
    description: "Upload your resume and practice mock interviews tailored to your experience.",
  },
};

export default function Page() {
  return <LandingPage />;
}
