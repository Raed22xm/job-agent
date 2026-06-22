import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/components/AppShell";
import ChunkLoadRecovery from "@/components/ChunkLoadRecovery";
import { JobAgentProvider } from "@/context/JobAgentContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <ChunkLoadRecovery />
        <JobAgentProvider>
          <AppShell>{children}</AppShell>
        </JobAgentProvider>
      </body>
    </html>
  );
}
