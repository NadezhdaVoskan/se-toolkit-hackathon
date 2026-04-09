import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpeakPlan",
  description: "A voice-first planner for weekly tasks and voice notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
