import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Weekly Planner",
  description: "A voice-first planner for weekly student tasks.",
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

