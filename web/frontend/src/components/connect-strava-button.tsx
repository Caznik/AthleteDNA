"use client";

import { Button } from "@/components/ui/button";
import { useConnect } from "@/lib/queries";

export function ConnectStravaButton() {
  const connect = useConnect();
  const handleConnect = async () => {
    const data = await connect.mutateAsync();
    window.location.href = data.authorizationUrl;
  };
  return (
    <Button onClick={handleConnect} disabled={connect.isPending}>
      {connect.isPending ? "Connecting…" : "Connect Strava"}
    </Button>
  );
}
