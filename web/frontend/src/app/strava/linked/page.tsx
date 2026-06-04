"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
  const params = useSearchParams();
  const error = params.get("error");
  const status = useStravaStatus();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strava connection failed</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <p className="text-sm text-muted-foreground">
            The link could not be completed (reason: {error}). Please try
            connecting again.
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
          <CardTitle>Strava connected</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <p className="text-sm text-muted-foreground">
            Your Strava account is linked. You can now sync your activities.
          </p>
          <Button asChild>
            <Link href="/">Go to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Not connected</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t confirm a Strava link. Try connecting again.
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
