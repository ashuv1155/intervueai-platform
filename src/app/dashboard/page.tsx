import { Metadata } from "next";
import DashboardClient from "./dashboard-client";

export const metadata: Metadata = {
  title: "Candidate Dashboard | IntervueAI",
  description: "Monitor your interview readiness score, review past simulation sessions, and track experience alignment metrics.",
};

export default function Page() {
  return <DashboardClient />;
}
