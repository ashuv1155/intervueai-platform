import { Metadata } from "next";
import SignupPageClient from "./signup-client";

export const metadata: Metadata = {
  title: "Create Your Account | IntervueAI",
  description: "Sign up for IntervueAI to configure tailored mock interview simulations, track experience alignment, and practice under realistic pressure.",
};

export default function Page() {
  return <SignupPageClient />;
}
