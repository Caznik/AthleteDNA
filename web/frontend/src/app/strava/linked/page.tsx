"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectStravaButton } from "@/components/connect-strava-button";
import { useStravaStatus } from "@/lib/queries";

function LinkedContent() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const error = params.get("error");
  const status = useStravaStatus();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("strava.linked.failedTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <p className="text-sm text-muted-foreground">
            {t("strava.linked.failedDescription", { reason: error })}
          </p>
          <ConnectStravaButton />
        </CardContent>
      </Card>
    );
  }

  if (status.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  // Honest about state: confirm via api/strava/status rather than assuming success.
  if (status.data?.linked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("strava.linked.connectedTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <p className="text-sm text-muted-foreground">
            {t("strava.linked.connectedDescription")}
          </p>
          <Button asChild>
            <Link href="/">{t("strava.linked.goDashboard")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("strava.linked.notConnectedTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground">
          {t("strava.linked.notConnectedDescription")}
        </p>
        <ConnectStravaButton />
      </CardContent>
    </Card>
  );
}

export default function StravaLinkedPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <LinkedContent />
    </Suspense>
  );
}
