"use client";

import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useConnect } from "@/lib/queries";

export function ConnectStravaButton() {
  const { t } = useTranslation();
  const connect = useConnect();
  const handleConnect = async () => {
    const data = await connect.mutateAsync();
    window.location.href = data.authorizationUrl;
  };
  return (
    <Button onClick={handleConnect} disabled={connect.isPending}>
      {connect.isPending ? t("strava.connecting") : t("strava.connect")}
    </Button>
  );
}
