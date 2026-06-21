import { NextRequest, NextResponse } from "next/server";
import { scoreAnswer } from "@/lib/gemini";
import { adminDb } from "@/lib/firebase-admin";

export const maxDuration = 60; // Allow up to 60 seconds for answer scoring and critique

export async function POST(req: NextRequest) {
  let reqBody: any = {};
  try {
    reqBody = await req.json();
    const { sessionId, questionId, userAnswer } = reqBody;

    if (!sessionId || !questionId || userAnswer === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sessionRef = adminDb.collection("sessions").doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    const session = sessionSnap.data()!;

    const questionRef = sessionRef.collection("questions").doc(questionId);
    const questionSnap = await questionRef.get();
    if (!questionSnap.exists) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    const question = questionSnap.data()!;

    const resumeRef = adminDb.collection("resumes").doc(session.resumeId);
    const resumeSnap = await resumeRef.get();
    const resumeContext = resumeSnap.exists 
      ? JSON.stringify(resumeSnap.data()!.parsedData) 
      : "No resume details available";

    const answerRef = sessionRef.collection("answers").doc(questionId);
    await answerRef.set({
      questionId,
      answerText: userAnswer,
      submittedAt: new Date().toISOString(),
      scoringStatus: "scoring",
    }, { merge: true });

    let scoringResult;
    try {
      scoringResult = await scoreAnswer(
        question.text,
        question.expectedFocus || "",
        userAnswer,
        resumeContext,
        session.difficulty
      );
    } catch (apiError) {
      console.warn("First scoring attempt failed, retrying...", apiError);
      // Retry once
      scoringResult = await scoreAnswer(
        question.text,
        question.expectedFocus || "",
        userAnswer,
        resumeContext,
        session.difficulty
      );
    }

    const finalAnswerDoc = {
      questionId,
      answerText: userAnswer,
      submittedAt: new Date().toISOString(),
      scoringStatus: "scored",
      score: Number(scoringResult.score),
      rationale: scoringResult.rationale,
      idealAnswer: scoringResult.idealAnswer,
    };

    await answerRef.set(finalAnswerDoc);

    return NextResponse.json({ success: true, result: finalAnswerDoc });
  } catch (error: any) {
    console.error("Scoring error:", error);
    try {
      const { sessionId, questionId } = reqBody;
      if (sessionId && questionId) {
        await adminDb
          .collection("sessions")
          .doc(sessionId)
          .collection("answers")
          .doc(questionId)
          .set({ scoringStatus: "failed" }, { merge: true });
      }
    } catch (e) {
      console.error("Could not set failed status in DB:", e);
    }
    
    return NextResponse.json({ error: error.message || "Failed to score answer" }, { status: 500 });
  }
}
