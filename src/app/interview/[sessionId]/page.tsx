import { Metadata } from "next";
import ArenaClient from "./arena-client";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export const metadata: Metadata = {
  title: "Live Mock Interview Arena | IntervueAI",
  description: "Live interactive mock interview simulation session. Speak or type your answers, and observe real-time AI evaluation progress.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page({ params }: PageProps) {
  const { sessionId } = await params;
  return <ArenaClient sessionId={sessionId} />;
}
