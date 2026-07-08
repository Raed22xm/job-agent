import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AppShell from "@/components/AppShell";
import ChunkLoadRecovery from "@/components/ChunkLoadRecovery";
import { JobAgentProvider } from "@/context/JobAgentContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Job Agent",
  description: "Local job application assistant with ATS-friendly CV tailoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans">
        <ChunkLoadRecovery />
        <JobAgentProvider>
          <AppShell>{children}</AppShell>
        </JobAgentProvider>
      </body>
    </html>
  );
}
