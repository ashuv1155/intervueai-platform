import { Metadata } from "next";
import ConfigureClient from "./configure-client";

export const metadata: Metadata = {
  title: "Configure Your Simulation | IntervueAI",
  description: "Upload your resume in PDF or DOCX format, specify target interview parameters, and begin practicing under simulated pressure.",
};

export default function Page() {
  return <ConfigureClient />;
}
