"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "sonner";

import { LanguageSync } from "@/components/language-sync";
import { ThemeSync } from "@/components/theme-sync";
import i18n from "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* The i18next singleton starts on "en" (server-matching); <LanguageSync/>
          applies the signed-in user's stored language post-mount. */}
      <I18nextProvider i18n={i18n}>
        {/* attribute="class" toggles `.dark` on <html>; enableSystem honors the OS.
            The injected blocking script reads the stored choice before first paint,
            so there is no flash of the wrong theme (AC-4). */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Apply the backend-stored preferences app-wide once the session loads. */}
          <ThemeSync />
          <LanguageSync />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
