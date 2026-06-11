import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "AthleteDNA",
  description: "Strava training dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
