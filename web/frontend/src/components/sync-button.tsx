"use client";

import { Button } from "@/components/ui/button";
import { useSync } from "@/lib/queries";

export function SyncButton() {
  const sync = useSync();
  return (
    <Button
      variant="outline"
      onClick={() => sync.mutate()}
      disabled={sync.isPending}
      data-testid="sync-button"
    >
      {sync.isPending ? "Syncing…" : "Sync activities"}
    </Button>
  );
}
