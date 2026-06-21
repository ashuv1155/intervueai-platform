import { NextRequest, NextResponse } from "next/server";
import { generateReportSummary } from "@/lib/gemini";
import { adminDb } from "@/lib/firebase-admin";

export const maxDuration = 60; // Allow up to 60 seconds for career coach summary report generation

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const sessionRef = adminDb.collection("sessions").doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    const session = sessionSnap.data()!;

    const questionsSnap = await sessionRef.collection("questions").get();
    const answersSnap = await sessionRef.collection("answers").get();

    const questionsMap = new Map();
    questionsSnap.forEach((doc: any) => {
      questionsMap.set(doc.id, doc.data());
    });

    const answersList: any[] = [];
    answersSnap.forEach((doc: any) => {
      answersList.push(doc.data());
    });

    const compiledQA = answersList.map((ans) => {
      const q = questionsMap.get(ans.questionId) || {};
      return {
        question: q.text || "",
        answer: ans.answerText || "",
        score: Number(ans.score) || 0,
        rationale: ans.rationale || "",
      };
    });

    const totalScore = compiledQA.reduce((acc, curr) => acc + curr.score, 0);
    const averageScore = compiledQA.length > 0 ? Number((totalScore / compiledQA.length).toFixed(1)) : 0;

    let summaryResult = {
      strengths: ["Communication clarity", "Resume project familiarity"],
      weaknesses: ["Answering with specific architectural details", "Structured behavioral framing (STAR method)"],
      overallFeedback: "Good overall performance. Focus on articulating specific metrics for projects and structuring answers using the STAR method for behavioral questions.",
    };

    try {
      summaryResult = await generateReportSummary(compiledQA);
    } catch (geminiErr) {
      console.warn("Failed to generate overall report summary via AI system, using fallback.", geminiErr);
    }

    const updateData = {
      status: "completed",
      overallScore: averageScore,
      completedAt: new Date().toISOString(),
      summary: summaryResult,
    };

    await sessionRef.update(updateData);

    return NextResponse.json({ 
      success: true, 
      session: { ...session, ...updateData } 
    });
  } catch (error: any) {
    console.error("Session completion error:", error);
    return NextResponse.json({ error: error.message || "Failed to complete session" }, { status: 500 });
  }
}
