"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FitImportResponse, FitImportStatus } from "@/lib/types";

// Maps an import status to a Badge variant. Failed is destructive; duplicate is muted;
// imported/enriched are positive (default/secondary).
const STATUS_VARIANT: Record<
  FitImportStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  imported: "default",
  enriched: "secondary",
  duplicate: "outline",
  failed: "destructive",
};

export function ProfileFitUpload() {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [summary, setSummary] = useState<FitImportResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSummary(null);
    setFiles(Array.from(event.target.files ?? []));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setPending(true);
    setError(null);
    setSummary(null);
    try {
      const body = new FormData();
      for (const file of files) {
        body.append("files", file);
      }
      const res = await fetch("/api/fit/import", { method: "POST", body });
      if (!res.ok) {
        throw new Error("generic");
      }
      const data = (await res.json()) as FitImportResponse;
      setSummary(data);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError(t("profile.fit.error"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("profile.fit.title")}</CardTitle>
        <CardDescription>{t("profile.fit.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <input
          ref={inputRef}
          type="file"
          accept=".fit"
          multiple
          aria-label={t("profile.fit.choose")}
          onChange={handleSelect}
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={files.length === 0 || pending}
          >
            {pending ? t("profile.fit.uploading") : t("profile.fit.upload")}
          </Button>
        </div>

        {summary ? (
          <div className="flex flex-col gap-2" data-testid="fit-import-results">
            <p className="text-sm text-muted-foreground">
              {t("profile.fit.summary", {
                imported: summary.imported,
                enriched: summary.enriched,
                duplicates: summary.duplicates,
                failed: summary.failed,
              })}
            </p>
            <ul className="flex flex-col gap-1">
              {summary.results.map((item, index) => (
                <li
                  key={`${item.filename}-${index}`}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate">{item.filename}</span>
                  <span className="flex items-center gap-2">
                    {item.error ? (
                      <span className="truncate text-destructive">{item.error}</span>
                    ) : null}
                    <Badge variant={STATUS_VARIANT[item.status]}>
                      {t(`profile.fit.status.${item.status}`)}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
