import { Metadata } from "next";
import { adminDb } from "@/lib/firebase-admin";
import ReportClient from "./report-client";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sessionId } = await params;
  try {
    const docRef = adminDb.collection("sessions").doc(sessionId);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      const type = data?.type || "Mock";
      const score = data?.overallScore !== undefined ? `${data.overallScore}/10` : "Evaluation";
      return {
        title: `${type} Interview Feedback Report (${score}) | IntervueAI`,
        description: `Detailed AI coaching report for the ${type} mock interview session. Review individual scores, rationales, and ideal references.`,
        robots: {
          index: false,
          follow: false,
        },
      };
    }
  } catch (err) {
    console.error("Error generating report page metadata:", err);
  }

  return {
    title: "Interview Session Report | IntervueAI",
    description: "Detailed AI coaching report and question-by-question breakdown of your mock interview performance.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { sessionId } = await params;
  return <ReportClient sessionId={sessionId} />;
}
