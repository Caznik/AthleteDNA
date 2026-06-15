"use client";

import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useFitImport } from "@/lib/queries";

// Compact .fit importer for the Activities header: an outline button that drives
// a hidden file input. Upload result and errors are reported via toast (see
// useFitImport); the profile page hosts the fuller, per-file results view.
export function FitImportButton() {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const fitImport = useFitImport();

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Reset so picking the same file(s) again still fires onChange.
    event.target.value = "";
    if (files.length > 0) fitImport.mutate(files);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".fit"
        multiple
        aria-label={t("activities.fit.choose")}
        onChange={handleSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        loading={fitImport.isPending}
        data-testid="fit-import-button"
      >
        {fitImport.isPending ? t("activities.importing") : t("activities.import")}
      </Button>
    </>
  );
}
