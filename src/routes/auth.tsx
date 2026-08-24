import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { loadProfile } from "@/lib/petmog";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to PetMog — Save Your Pet's ELO" },
      {
        name: "description",
        content:
          "Create a PetMog account or log in to sync your pet's ELO, rank and duel record across every device.",
      },
      { property: "og:title", content: "Sign in to PetMog" },
      { property: "og:description", content: "Save your pet's duel record and rank to your PetMog account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [petName, setPetName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/profile", replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const local = loadProfile();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              username: email.split("@")[0],
              pet_name: petName.trim() || local.petName,
            },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("Check your email to confirm your account 🐾");
          return;
        }
        toast.success("Welcome to PetMog!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back! 🐾");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/profile" });
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <div className="overflow-hidden rounded-[2rem] shadow-pop">
        <img
          src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80"
          alt="A smiling golden retriever ready to duel"
          className="h-40 w-full object-cover"
        />
        <div className="card-soft rounded-none border-x-0 border-b-0 p-6 sm:p-8">
          <div className="text-center">
            <h1 className="font-display text-3xl font-extrabold text-gradient">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              Sync your pet's ELO, rank and record everywhere.
            </p>
          </div>

          {sent ? (
            <p className="mt-6 rounded-2xl bg-muted p-4 text-center text-sm font-semibold">
              We sent a confirmation link to <span className="font-extrabold">{email}</span>. Click it to
              activate your account, then come back and sign in.
            </p>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="mt-6 w-full rounded-full font-bold"
                disabled={busy}
                onClick={google}
              >
                Continue with Google
              </Button>

              <div className="my-4 flex items-center gap-3 text-xs font-bold text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={submit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-full"
                  />
                </div>
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="petName">Pet name</Label>
                    <Input
                      id="petName"
                      value={petName}
                      onChange={(e) => setPetName(e.target.value.slice(0, 20))}
                      placeholder="Waffle"
                      className="rounded-full"
                    />
                  </div>
                )}
                <Button type="submit" disabled={busy} className="w-full rounded-full font-extrabold">
                  {mode === "signup" ? "Create account" : "Sign in"}
                </Button>
              </form>

              <button
                type="button"
                className="mt-4 w-full text-center text-sm font-bold text-muted-foreground transition hover:text-foreground"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              >
                {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
