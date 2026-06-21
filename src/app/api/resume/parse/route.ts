import { NextRequest, NextResponse } from "next/server";
import { analyzeResume } from "@/lib/gemini";
import { adminDb } from "@/lib/firebase-admin";
import mammoth from "mammoth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or userId" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let parsedData: any = null;

    if (file.name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      const resumeText = result.value;
      if (!resumeText.trim()) {
        return NextResponse.json({ error: "Resume text could not be extracted or file is empty." }, { status: 400 });
      }
      parsedData = await analyzeResume(resumeText);
    } else if (file.name.endsWith(".pdf")) {
      parsedData = await analyzeResume({
        buffer: fileBuffer,
        mimeType: "application/pdf"
      });
    } else {
      return NextResponse.json({ error: "Unsupported file format. Please upload PDF or DOCX." }, { status: 400 });
    }

    if (!parsedData) {
      return NextResponse.json({ error: "Failed to parse structured resume data." }, { status: 500 });
    }

    const resumeId = crypto.randomUUID();
    const resumeRef = adminDb.collection("resumes").doc(resumeId);
    
    const resumeDoc = {
      id: resumeId,
      userId,
      fileName: file.name,
      parsedData,
      createdAt: new Date().toISOString(),
    };

    await resumeRef.set(resumeDoc);

    const userRef = adminDb.collection("users").doc(userId);
    await userRef.set({
      activeResumeId: resumeId,
      resumeUploaded: true,
    }, { merge: true });

    return NextResponse.json({ success: true, resumeId, parsedData });
  } catch (error: any) {
    console.error("Resume parsing error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse resume" }, { status: 500 });
  }
}
