"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser, useLogout } from "@/lib/auth-queries";
import { photoSrc } from "@/lib/photo";

// First two characters of the display name, used for the avatar fallback.
function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export function AuthNav() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();

  if (isLoading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/register">Sign up</Link>
        </Button>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.push("/login");
  };

  // Fall back to the email if the backend hasn't supplied a username, so a
  // missing field degrades gracefully instead of taking down the app shell.
  const displayName = user.username || user.email;
  const avatarSrc = photoSrc(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Open user menu"
        >
          <Avatar>
            {avatarSrc ? <AvatarImage src={avatarSrc} alt={displayName} /> : null}
            <AvatarFallback>{initials(displayName)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="truncate">
          {displayName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
          disabled={logout.isPending}
        >
          <LogOut />
          {logout.isPending ? "Logging out…" : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
