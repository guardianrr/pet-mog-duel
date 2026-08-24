import { Link } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/session";

export function AccountActions({
  user,
  loading,
  showGuestProfile = false,
  onSignedOut,
}: {
  user: User | null;
  loading: boolean;
  showGuestProfile?: boolean;
  onSignedOut?: () => void;
}) {
  const [signingOut, setSigningOut] = useState(false);

  if (loading) return <span aria-hidden className="size-9 shrink-0" />;

  return (
    <>
      {(user || showGuestProfile) && (
        <Button asChild variant="ghost" size="sm" className="rounded-full font-bold">
          <Link to="/profile" title={user?.email ?? "Local profile"}>
            <UserRound className="size-4" />
            <span className="hidden sm:inline">{user ? "Account" : "Profile"}</span>
          </Link>
        </Button>
      )}
      {user ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full font-bold"
          disabled={signingOut}
          aria-label="Sign out"
          onClick={async () => {
            setSigningOut(true);
            try {
              await signOut();
              onSignedOut?.();
              toast.success("Signed out");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not sign out");
            } finally {
              setSigningOut(false);
            }
          }}
        >
          <LogOut className="size-4" />
          <span className="hidden lg:inline">Sign out</span>
        </Button>
      ) : (
        <Button asChild variant="ghost" size="sm" className="rounded-full font-bold">
          <Link to="/auth">
            <LogIn className="size-4" />
            <span className="hidden sm:inline">Sign in</span>
          </Link>
        </Button>
      )}
    </>
  );
}
