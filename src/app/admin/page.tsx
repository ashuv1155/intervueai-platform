import { Metadata } from "next";
import AdminClient from "./admin-client";

export const metadata: Metadata = {
  title: "System Administration Console | IntervueAI",
  description: "Monitor usage metrics, modify user status, plan settings, reset credit limits, and control global system maintenance flags.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <AdminClient />;
}
