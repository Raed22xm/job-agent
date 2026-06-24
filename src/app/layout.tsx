import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import ChunkLoadRecovery from "@/components/ChunkLoadRecovery";
import { JobAgentProvider } from "@/context/JobAgentContext";
import "./globals.css";

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
      <body className="font-sans">
        <ChunkLoadRecovery />
        <JobAgentProvider>
          <AppShell>{children}</AppShell>
        </JobAgentProvider>
      </body>
    </html>
  );
}
