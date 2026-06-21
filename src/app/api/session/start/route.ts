import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "@/lib/gemini";
import { adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";

export const maxDuration = 60; // Allow up to 60 seconds for question generation

export async function POST(req: NextRequest) {
  try {
    const { userId, resumeId, type, difficulty, durationMinutes } = await req.json();

    if (!userId || !resumeId || !type || !difficulty || !durationMinutes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const userData = userSnap.data()!;
    const plan = userData.plan || "Free";
    const interviewsThisMonth = userData.interviewsThisMonth || 0;

    if (plan === "Free" && interviewsThisMonth >= 3) {
      return NextResponse.json({ 
        error: "Monthly interview limit reached. Upgrade to Pro for unlimited mock interviews." 
      }, { status: 403 });
    }

    const resumeRef = adminDb.collection("resumes").doc(resumeId);
    const resumeSnap = await resumeRef.get();
    
    if (!resumeSnap.exists) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const resumeData = resumeSnap.data()!.parsedData;
    const questions = await generateQuestions(resumeData, type, difficulty, durationMinutes);

    if (!questions || !questions.length) {
      return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
    }

    const sessionId = crypto.randomUUID();
    const sessionRef = adminDb.collection("sessions").doc(sessionId);

    const sessionDoc = {
      id: sessionId,
      userId,
      resumeId,
      type,
      difficulty,
      durationMinutes,
      status: "in_progress",
      questionCount: questions.length,
      overallScore: 0,
      createdAt: new Date().toISOString(),
    };

    await sessionRef.set(sessionDoc);

    const batch = adminDb.batch();
    const questionsList = questions.map((q, idx) => {
      const questionId = `q_${idx + 1}`;
      const qRef = sessionRef.collection("questions").doc(questionId);
      const qData = {
        id: questionId,
        text: q.text,
        topic: q.topic,
        difficultyTag: q.difficultyTag,
        expectedFocus: q.expectedFocus,
        order: idx + 1,
      };
      batch.set(qRef, qData);
      return qData;
    });

    await batch.commit();

    await userRef.update({
      interviewsThisMonth: interviewsThisMonth + 1,
    });

    return NextResponse.json({ 
      success: true, 
      session: sessionDoc,
      questions: questionsList
    });
  } catch (error: any) {
    console.error("Session start error:", error);
    return NextResponse.json({ error: error.message || "Failed to start session" }, { status: 500 });
  }
}
