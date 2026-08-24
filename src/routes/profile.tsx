import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { defaultProfile, loadProfile, rankFor, saveProfile, RANKS, type Profile } from "@/lib/petmog";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your PetMog Profile — ELO, Rank & Record" },
      {
        name: "description",
        content: "Track your PetMog duel record: wins, losses, current ELO, rank badge and highest rank reached.",
      },
      { property: "og:title", content: "Your PetMog Profile" },
      { property: "og:description", content: "Your pet's duel record, ELO and rank progress on PetMog." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(() => defaultProfile());
  useEffect(() => setProfile(loadProfile()), []);

  const update = (patch: Partial<Profile>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    saveProfile(next);
  };

  const rank = rankFor(profile.elo);
  const peakRank = rankFor(profile.peakElo);
  const games = profile.wins + profile.losses;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="card-soft relative overflow-hidden p-8 text-center">
        <div className="pointer-events-none absolute -right-8 -top-8 text-8xl opacity-15">🐾</div>
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-accent text-5xl shadow-soft">
          {rank.emoji}
        </div>
        <h1 className="mt-3 font-display text-4xl font-extrabold text-gradient">{profile.petName}</h1>
        <p className="text-sm font-semibold text-muted-foreground">@{profile.username}</p>
        <p className="mt-4 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-extrabold text-accent-foreground shadow-soft">
          {rank.name} · {profile.elo} ELO
        </p>
        <div className="mt-7 grid grid-cols-3 gap-3">
          {[
            ["Wins", profile.wins],
            ["Losses", profile.losses],
            ["Win rate", games ? `${Math.round((profile.wins / games) * 100)}%` : "—"],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-2xl bg-muted p-4">
              <p className="font-display text-2xl font-extrabold">{value}</p>
              <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs font-semibold text-muted-foreground">
          Highest rank reached: {peakRank.emoji} {peakRank.name} ({profile.peakElo})
        </p>
      </div>

      <div className="card-soft mt-4 space-y-4 p-6 sm:p-8">
        <h2 className="font-display text-xl font-extrabold">Your pet</h2>
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
            const fresh = defaultProfile();
            setProfile(fresh);
            saveProfile(fresh);
            toast.success("Stats reset — fresh pet, fresh start 🐾");
          }}
        >
          Reset stats
        </Button>
      </div>

      <div className="card-soft mt-4 p-6 sm:p-8">
        <h2 className="font-display text-xl font-extrabold">Ranks</h2>
        <ul className="mt-3 space-y-1.5 text-sm font-semibold">
          {RANKS.map((r) => (
            <li
              key={r.name}
              className={`flex justify-between rounded-xl px-3 py-2.5 transition-colors ${
                r.name === rank.name ? "bg-accent text-accent-foreground shadow-soft" : "text-muted-foreground hover:bg-muted"
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
