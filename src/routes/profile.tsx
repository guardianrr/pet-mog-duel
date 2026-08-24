import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AccountActions } from "@/components/AccountActions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { persistProfile, useCloudProfileSync } from "@/lib/cloud-profile";
import { defaultProfile, loadProfile, rankFor, RANKS, type Profile } from "@/lib/petmog";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your PetMog Profile — ELO, Rank & Record" },
      {
        name: "description",
        content:
          "Track your PetMog duel record: wins, losses, current ELO, rank badge and highest rank reached.",
      },
      { property: "og:title", content: "Your PetMog Profile" },
      {
        property: "og:description",
        content: "Your pet's duel record, ELO and rank progress on PetMog.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<Profile>(() => defaultProfile());

  useCloudProfileSync(user?.id, setProfile);

  useEffect(() => setProfile(loadProfile()), []);

  const update = (patch: Partial<Profile>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    persistProfile(next);
  };

  const rank = rankFor(profile.elo);
  const peakRank = rankFor(profile.peakElo);
  const games = profile.wins + profile.losses;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" className="rounded-full font-bold">
          <Link to="/">
            <ArrowLeft className="size-4" /> Home
          </Link>
        </Button>
        <div className="flex items-center gap-1">
          <AccountActions
            user={user}
            loading={sessionLoading}
            onSignedOut={() => setProfile(loadProfile())}
          />
          <ThemeToggle />
        </div>
      </div>

      <div className="card-soft p-6 text-center">
        <div className="text-6xl">{rank.emoji}</div>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-gradient">
          {profile.petName}
        </h1>
        <p className="text-sm font-semibold text-muted-foreground">@{profile.username}</p>
        <p className="mt-3 inline-block rounded-full bg-accent px-4 py-1 text-sm font-bold text-accent-foreground">
          {rank.name} · {profile.elo} ELO
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            ["Wins", profile.wins],
            ["Losses", profile.losses],
            ["Win rate", games ? `${Math.round((profile.wins / games) * 100)}%` : "—"],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-2xl bg-muted p-3">
              <p className="font-display text-2xl font-extrabold">{value}</p>
              <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs font-semibold text-muted-foreground">
          Highest rank reached: {peakRank.emoji} {peakRank.name} ({profile.peakElo})
        </p>
      </div>

      <div className="card-soft mt-4 space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={profile.username}
              onChange={(e) => update({ username: e.target.value.slice(0, 20) })}
              className="rounded-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pet">Pet name</Label>
            <Input
              id="pet"
              value={profile.petName}
              onChange={(e) => update({ petName: e.target.value.slice(0, 20) })}
              className="rounded-full"
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
          <span className="text-sm font-bold">Sound effects</span>
          <Switch checked={profile.sound} onCheckedChange={(v) => update({ sound: v })} />
        </div>
        <Button
          variant="ghost"
          className="w-full rounded-full font-bold text-lose"
          onClick={() => {
            const fresh: Profile = {
              ...profile,
              elo: 1000,
              peakElo: 1000,
              wins: 0,
              losses: 0,
            };
            setProfile(fresh);
            persistProfile(fresh);
            toast.success("Stats reset — fresh pet, fresh start 🐾");
          }}
        >
          Reset stats
        </Button>
      </div>

      <div className="card-soft mt-4 p-6">
        <h2 className="font-display text-xl font-extrabold">Ranks</h2>
        <ul className="mt-3 space-y-1.5 text-sm font-semibold">
          {RANKS.map((r) => (
            <li
              key={r.name}
              className={`flex justify-between rounded-xl px-3 py-2 ${
                r.name === rank.name ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              }`}
            >
              <span>
                {r.emoji} {r.name}
              </span>
              <span>{r.min}+</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
