"use client";

import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectStravaButton } from "@/components/connect-strava-button";
import { useStravaStatus } from "@/lib/queries";

export function ProfileStravaCard() {
  const { t } = useTranslation();
  const status = useStravaStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("profile.strava.title")}</CardTitle>
        <CardDescription>{t("profile.strava.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {status.isLoading ? (
          <Skeleton className="h-9 w-40" />
        ) : status.isError ? (
          <Badge variant="destructive">{t("profile.strava.statusUnavailable")}</Badge>
        ) : status.data?.linked ? (
          <Badge variant="secondary" data-testid="profile-strava-connected">
            {t("profile.strava.connected")}
          </Badge>
        ) : (
          <ConnectStravaButton />
        )}
      </CardContent>
    </Card>
  );
}
