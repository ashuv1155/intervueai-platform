import { Metadata } from "next";
import LoginPageClient from "./login-client";

export const metadata: Metadata = {
  title: "Sign In to Your Session | IntervueAI",
  description: "Sign in to IntervueAI to configure your customized mock interviews, upload new resumes, and practice with real-time AI feedback.",
};

export default function Page() {
  return <LoginPageClient />;
}
