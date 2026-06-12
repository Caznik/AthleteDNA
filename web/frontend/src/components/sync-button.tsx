"use client";

import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useSync } from "@/lib/queries";

export function SyncButton() {
  const { t } = useTranslation();
  const sync = useSync();
  return (
    <Button
      variant="outline"
      onClick={() => sync.mutate()}
      loading={sync.isPending}
      data-testid="sync-button"
    >
      {sync.isPending ? t("strava.syncing") : t("strava.sync")}
    </Button>
  );
}
