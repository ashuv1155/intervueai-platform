import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IntervueAI Mock Interviews",
    short_name: "IntervueAI",
    description: "Ace your next job interview with our resume-aware AI mock interview platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#07090e",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
