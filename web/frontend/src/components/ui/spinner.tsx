import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

// Inherits its colour from the host's text colour (lucide draws with
// currentColor), so a Spinner adopts whatever foreground its container uses.
function Spinner({ className }: { className?: string }) {
  return (
    <span role="status" className="inline-flex">
      <Loader2 aria-hidden className={cn("h-4 w-4 animate-spin", className)} />
      <span className="sr-only">Loading</span>
    </span>
  );
}

export { Spinner };
