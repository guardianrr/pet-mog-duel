import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LogOut, Menu, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signOut, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/" as const, label: "Home", exact: true },
  { to: "/leaderboard" as const, label: "Leaderboard", exact: false },
  { to: "/profile" as const, label: "Profile", exact: false },
  { to: "/auth" as const, label: "Auth", exact: false },
];

function NavLink({
  to,
  label,
  exact,
  onClick,
}: {
  to: (typeof NAV_ITEMS)[number]["to"];
  label: string;
  exact?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      activeOptions={exact ? { exact: true } : undefined}
      className="rounded-full px-3.5 py-2 text-sm font-extrabold transition-all duration-200"
      activeProps={{
        className: "bg-primary text-primary-foreground shadow-soft",
        "aria-current": "page",
      }}
      inactiveProps={{
        className: "text-muted-foreground hover:bg-muted hover:text-foreground",
      }}
    >
      {label}
    </Link>
  );
}

function AccountCluster({
  user,
  loading,
  stacked,
  onDone,
}: {
  user: ReturnType<typeof useSession>["user"];
  loading: boolean;
  stacked?: boolean;
  onDone?: () => void;
}) {
  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-muted" aria-hidden />;
  }

  if (!user) {
    return (
      <Button asChild size="sm" className={cn("rounded-full font-extrabold", stacked && "w-full")}>
        <Link to="/auth" onClick={onDone}>
          Sign in
        </Link>
      </Button>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out — see you soon 🐾");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign out");
    }
    onDone?.();
  };

  return (
    <div className={cn("flex items-center gap-2", stacked && "w-full flex-col")}>
      <Button
        asChild
        variant="secondary"
        size="sm"
        className={cn("rounded-full font-bold", stacked && "w-full")}
      >
        <Link to="/profile" onClick={onDone}>
          <UserRound className="size-4" /> Account
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn("rounded-full font-bold", stacked && "w-full")}
        onClick={handleSignOut}
      >
        <LogOut className="size-4" /> Sign out
      </Button>
    </div>
  );
}

export function AppHeader() {
  const { user, loading } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="group flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary/15 text-xl shadow-soft transition-transform duration-300 group-hover:scale-105 group-hover:rotate-6">
            🐾
          </span>
          <span className="font-display text-2xl font-extrabold text-gradient">PetMog</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} {...item} />
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <AccountCluster user={user} loading={loading} />
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label={open ? "Close menu" : "Open menu"}
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="rounded-l-3xl bg-background/95">
              <SheetHeader>
                <SheetTitle className="font-display text-left text-2xl font-extrabold text-gradient">
                  PetMog
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2" aria-label="Mobile">
                {NAV_ITEMS.map((item) => (
                  <NavLink key={item.to} {...item} onClick={() => setOpen(false)} />
                ))}
              </nav>
              <div className="mt-6 border-t border-border pt-4">
                <AccountCluster
                  user={user}
                  loading={loading}
                  stacked
                  onDone={() => setOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
