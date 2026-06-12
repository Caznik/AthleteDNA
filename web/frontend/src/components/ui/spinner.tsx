import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

// Inherits its colour from the host's text colour (lucide draws with
// currentColor), so a Spinner adopts whatever foreground its container uses.
function Spinner({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span role="status" className="inline-flex">
      <Loader2 aria-hidden className={cn("h-4 w-4 animate-spin", className)} />
      <span className="sr-only">{t("common.loading")}</span>
    </span>
  );
}

export { Spinner };
