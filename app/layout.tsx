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
      <body>
        {children}
        <style>{`
          @media (min-width: 769px) {
            .fm-hero-copy {
              top: auto !important;
              bottom: 112px !important;
              transform: none !important;
            }
          }

          @media (min-width: 769px) and (max-width: 1150px) {
            .fm-hero-copy {
              bottom: 112px !important;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
