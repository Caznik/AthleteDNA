"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfilePasswordForm } from "@/components/profile-password-form";
import { ProfilePhotoForm } from "@/components/profile-photo-form";
import { ProfileStravaCard } from "@/components/profile-strava-card";
import { ProfileUsernameForm } from "@/components/profile-username-form";
import { useCurrentUser } from "@/lib/auth-queries";
import { photoSrc } from "@/lib/photo";

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full max-w-2xl" />
        <Skeleton className="h-48 w-full max-w-2xl" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user.username || user.email;
  const avatarSrc = photoSrc(user);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>

      {/* Account summary — read-only identity. */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-14 w-14">
            {avatarSrc ? <AvatarImage src={avatarSrc} alt={displayName} /> : null}
            <AvatarFallback className="text-base">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </CardContent>
      </Card>

      <ProfilePhotoForm user={user} />
      <ProfileUsernameForm currentUsername={user.username} />
      <ProfilePasswordForm />
      <ProfileStravaCard />
    </div>
  );
}
