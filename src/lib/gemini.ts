import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Granular helper to initialize a GoogleGenerativeAI client instance on demand.
 */
function getAIInstance(apiKey: string) {
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Executes a generateContent call safely. Tries the primary key (GEMINI_API_KEY) first,
 * and if it encounters a quota/rate limit error (429), immediately retries using the 
 * fallback key (GEMINI_API_KEY_FALLBACK) if configured.
 */
async function safeGenerateContent(modelName: string, options: any) {
  const primaryKey = process.env.GEMINI_API_KEY?.trim();
  const fallbackKey = process.env.GEMINI_API_KEY_FALLBACK?.trim();

  if (!primaryKey) {
    throw new Error("GEMINI_API_KEY is not set. Please set it in your .env.local file.");
  }

  const runWithKey = async (key: string) => {
    const aiInstance = getAIInstance(key);
    const model = aiInstance.getGenerativeModel({ model: modelName });
    return await model.generateContent(options);
  };

  try {
    // 1. Try Primary Key
    return await runWithKey(primaryKey);
  } catch (primaryError: any) {
    const primaryMsg = primaryError?.message || String(primaryError);
    const isQuotaError = 
      primaryMsg.includes("429") ||
      primaryMsg.includes("quota") ||
      primaryMsg.includes("Quota") ||
      primaryMsg.includes("Too Many Requests") ||
      primaryMsg.includes("RateLimit") ||
      primaryMsg.includes("limit");

    if (isQuotaError && fallbackKey) {
      console.warn("Primary API key rate limited. Trying fallback API key...");
      try {
        // 2. Try Fallback Key
        return await runWithKey(fallbackKey);
      } catch (fallbackError: any) {
        console.error("Fallback API key failed:", fallbackError);
        const fallbackMsg = fallbackError?.message || String(fallbackError);
        const isFallbackQuota = 
          fallbackMsg.includes("429") ||
          fallbackMsg.includes("quota") ||
          fallbackMsg.includes("Quota") ||
          fallbackMsg.includes("Too Many Requests") ||
          fallbackMsg.includes("RateLimit") ||
          fallbackMsg.includes("limit");
        
        if (isFallbackQuota) {
          throw new Error("Our AI system is receiving too many requests right now. Please try again later.");
        }
        throw fallbackError;
      }
    }

    if (isQuotaError) {
      throw new Error("Our AI system is receiving too many requests right now. Please try again later.");
    }
    throw primaryError;
  }
}

/**
 * Legacy compatibility export for getting model instance statically.
 */
export const getGeminiModel = (modelName = "gemini-2.5-flash") => {
  const primaryKey = process.env.GEMINI_API_KEY?.trim();
  if (!primaryKey) {
    throw new Error("GEMINI_API_KEY is not set. Please set it in your .env.local file.");
  }
  return getAIInstance(primaryKey).getGenerativeModel({ model: modelName });
};

/**
 * Analyzes resume content (either string or PDF buffer) and extracts structured details.
 */
export async function analyzeResume(
  resumeContent: string | { buffer: Buffer; mimeType: string }
): Promise<any> {
  let parts: any[] = [];
  if (typeof resumeContent === "string") {
    parts.push({
      text: `Analyze the following resume text and extract key structural information as a JSON object.\n\nResume Text:\n${resumeContent}`,
    });
  } else {
    parts.push({
      inlineData: {
        data: resumeContent.buffer.toString("base64"),
        mimeType: resumeContent.mimeType,
      },
    });
    parts.push({
      text: `Analyze the uploaded resume file and extract key structural information as a JSON object.`,
    });
  }

  const prompt = `
You are an expert recruiter. You must return a valid JSON object matching the following structure:
{
  "skills": ["list of key technical and soft skills"],
  "experienceLevel": "Junior" | "Mid" | "Senior" | "Lead",
  "senioritySignal": "A brief summary sentence about experience level and career progression",
  "roles": [
    {
      "title": "Role Title",
      "company": "Company Name",
      "duration": "dates worked",
      "description": "short description of responsibilities and achievements"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "brief description of project and achievements",
      "technologies": ["tech1", "tech2"]
    }
  ]
}
Do not return any other text besides the JSON.`;

  parts.push({ text: prompt });

  const result = await safeGenerateContent("gemini-2.5-flash", {
    contents: [{ role: "user", parts: parts }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const responseText = result.response.text();
  return JSON.parse(responseText);
}

/**
 * Generates N tailored interview questions up front based on the candidate's resume and configuration.
 */
export async function generateQuestions(
  resumeData: any,
  type: string,
  difficulty: string,
  durationMinutes: number
): Promise<any[]> {
  // Calculate question count: 15min -> ~4, 30min -> ~8, 45min -> ~12, 60min -> ~15 questions
  let questionCount = 5;
  if (durationMinutes === 15) questionCount = 4;
  else if (durationMinutes === 30) questionCount = 8;
  else if (durationMinutes === 45) questionCount = 12;
  else if (durationMinutes === 60) questionCount = 15;

  const prompt = `
You are an expert interviewer conducting a "${type}" mock interview at a "${difficulty}" difficulty level.
The candidate's parsed resume data is:
${JSON.stringify(resumeData, null, 2)}

Generate a set of exactly ${questionCount} tailored, challenging interview questions.
The questions should deeply probe the candidate's specific projects, skills, and experience listed on their resume, matching the interview type (${type}).
- Technical: Ask coding, architecture, system design, or engineering questions tailored to their stack.
- HR/Behavioral: Ask behavioral questions (STAR format) probing collaboration, conflict resolution, or soft skills.
- Managerial: Probe leadership, system organization, product delivery, and team building.
- Custom (role-specific): Ask questions relevant to the target role inferred from their resume.

The output MUST be a valid JSON array of question objects matching this structure:
[
  {
    "text": "The question text to show to the candidate",
    "topic": "The primary skill or project being probed",
    "difficultyTag": "${difficulty}",
    "expectedFocus": "Internal hint describing what points the candidate should cover to get a high score (e.g., mention database scaling, caching, or detail their project role)."
  }
]
`;

  const result = await safeGenerateContent("gemini-2.5-flash", {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(result.response.text());
}

/**
 * Scores an individual answer in the background.
 */
export async function scoreAnswer(
  question: string,
  expectedFocus: string,
  userAnswer: string,
  resumeContext: string,
  difficulty: string
): Promise<any> {
  const prompt = `
You are an expert interviewer scoring a mock interview answer.
The difficulty level is "${difficulty}" (Easy questions are graded leniently, Hard questions are graded strictly).

Resume context of candidate:
${resumeContext}

Question asked:
"${question}"

Expected focus:
"${expectedFocus}"

Candidate's Answer:
"${userAnswer}"

Grade the candidate's answer. The output MUST be a valid JSON object matching the following structure:
{
  "score": <numeric score from 0 to 10 based on relevance, depth, correctness, and resume alignment>,
  "rationale": "A 1-2 sentence detailed critique of their answer, explaining why they got this score.",
  "idealAnswer": "A sample ideal response that demonstrates a 10/10 answer, illustrating what details they should have mentioned."
}
`;

  const result = await safeGenerateContent("gemini-2.5-flash", {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(result.response.text());
}

/**
 * Generates an overall report summary from all Q&As at the end of the session.
 */
export async function generateReportSummary(
  questionsAndAnswers: { question: string; answer: string; score: number; rationale: string }[]
): Promise<any> {
  const prompt = `
You are an expert career coach summarizing a candidate's complete mock interview.
Here is the history of the session (questions, answers, scores, and critiques):
${JSON.stringify(questionsAndAnswers, null, 2)}

Provide a comprehensive summary report. The output MUST be a valid JSON object matching the following structure:
{
  "strengths": ["list of 3 key strengths observed during the interview"],
  "weaknesses": ["list of 3 areas for improvement"],
  "overallFeedback": "A 2-3 paragraph encouraging yet constructive narrative summary. Evaluate their readiness, technical depth, communication style, and suggest actionable next steps."
}
`;

  const result = await safeGenerateContent("gemini-2.5-flash", {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(result.response.text());
}
