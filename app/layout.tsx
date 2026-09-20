import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FARM-MIND | Autonomous Agricultural Intelligence",
  description:
    "An autonomous agricultural agent that observes, decides, acts, and evolves.",
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