import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";

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
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
