"use client";

import { useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRemovePhoto, useUploadPhoto } from "@/lib/auth-queries";
import { photoSrc } from "@/lib/photo";
import type { AuthUser } from "@/lib/types";

// Mirrored from UpdateProfilePhotoService on the backend (the source of truth).
// Client-side pre-check gives fast feedback before a wasted round trip.
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export function ProfilePhotoForm({ user }: { user: AuthUser }) {
  const upload = useUploadPhoto();
  const remove = useRemovePhoto();
  const inputRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasPhoto = user.photoUpdatedAt != null;
  const displayName = user.username || user.email;
  const busy = upload.isPending || remove.isPending;

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setSelected(null);
      setPreviewUrl(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Unsupported image type. Use JPEG, PNG, or WebP.");
      setSelected(null);
      setPreviewUrl(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is too large. Maximum size is 2 MB.");
      setSelected(null);
      setPreviewUrl(null);
      return;
    }
    setSelected(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const resetInput = () => {
    setSelected(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selected) return;
    try {
      await upload.mutateAsync(selected);
      resetInput();
    } catch {
      // Errors surface as toasts from the mutation hook.
    }
  };

  const handleRemove = async () => {
    try {
      await remove.mutateAsync();
      resetInput();
    } catch {
      // Errors surface as toasts from the mutation hook.
    }
  };

  // Preview the freshly chosen file if any, else the stored photo, else initials.
  const currentSrc = previewUrl ?? photoSrc(user);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profile photo</CardTitle>
        <CardDescription>
          Upload a JPEG, PNG, or WebP image up to 2 MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {currentSrc ? (
              <AvatarImage src={currentSrc} alt={displayName} />
            ) : null}
            <AvatarFallback className="text-base">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Choose a photo"
            onChange={handleSelect}
            className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex gap-3">
          <Button type="button" onClick={handleUpload} disabled={!selected || busy}>
            {upload.isPending ? "Uploading…" : hasPhoto ? "Replace" : "Upload"}
          </Button>
          {hasPhoto ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              disabled={busy}
            >
              {remove.isPending ? "Removing…" : "Remove"}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
