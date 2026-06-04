"use client";

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
  const status = useStravaStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Strava</CardTitle>
        <CardDescription>
          Connect your Strava account to import activities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status.isLoading ? (
          <Skeleton className="h-9 w-40" />
        ) : status.isError ? (
          <Badge variant="destructive">Status unavailable</Badge>
        ) : status.data?.linked ? (
          <Badge variant="secondary" data-testid="profile-strava-connected">
            Strava connected
          </Badge>
        ) : (
          <ConnectStravaButton />
        )}
      </CardContent>
    </Card>
  );
}
