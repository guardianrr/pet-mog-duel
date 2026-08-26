import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Home, LogIn, LogOut, Menu, Trophy, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signOut, useSession } from "@/lib/session";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/profile", label: "Profile", icon: Heart },
] as const;

export function SiteHeader() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out — see you soon 🐾");
    void navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2" onClick={() => setOpen(false)}>
          <span className="text-2xl transition-transform duration-300 hover:rotate-12">🐾</span>
          <span className="font-display text-2xl font-extrabold text-gradient">PetMog</span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full bg-muted/60 p-1 md:flex">
          {TABS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-muted-foreground transition-all hover:text-foreground data-[status=active]:bg-card data-[status=active]:text-foreground data-[status=active]:shadow-sm"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!loading &&
            (user ? (
              <Button
                variant="outline"
                size="sm"
                className="hidden rounded-full font-bold sm:inline-flex"
                onClick={handleSignOut}
              >
                <LogOut className="size-4" /> Sign out
              </Button>
            ) : (
              <Button asChild size="sm" className="hidden rounded-full font-bold sm:inline-flex">
                <Link to="/auth">
                  <LogIn className="size-4" /> Sign in
                </Link>
              </Button>
            ))}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full md:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <Menu className="size-5" /> : <X className="size-5 rotate-45" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background/95 px-4 py-3 md:hidden">
          <nav className="grid gap-1">
            {TABS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted data-[status=active]:bg-accent data-[status=active]:text-accent-foreground"
              >
                <Icon className="size-4" /> {label}
              </Link>
            ))}
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void handleSignOut();
                }}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-muted-foreground hover:bg-muted"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
              >
                <LogIn className="size-4" /> Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
