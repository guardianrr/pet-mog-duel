import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { leaderboard, loadProfile, rankFor, type Profile } from "@/lib/petmog";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "PetMog Leaderboard — Top Pets by ELO" },
      {
        name: "description",
        content: "See the fluffiest legends on PetMog: top pets ranked by duel ELO, wins and rank badges.",
      },
      { property: "og:title", content: "PetMog Leaderboard" },
      { property: "og:description", content: "The top-ranked pets in the PetMog cuteness duels." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => setProfile(loadProfile()), []);
  const rows = profile ? leaderboard(profile) : [];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" className="rounded-full font-bold">
          <Link to="/">
            <ArrowLeft className="size-4" /> Home
          </Link>
        </Button>
        <ThemeToggle />
      </div>

      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
        🏆 <span className="text-gradient">Top Pets</span>
      </h1>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">Ranked by duel ELO this season.</p>

      <ul className="mt-6 space-y-2">
        {rows.map((row, i) => {
          const rank = rankFor(row.elo);
          const isMe = profile?.username === row.username;
          return (
            <li
              key={`${row.username}-${i}`}
              className={`card-soft flex items-center gap-3 p-4 ${isMe ? "ring-2 ring-primary" : ""}`}
            >
              <span className="w-8 font-display text-xl font-extrabold text-muted-foreground">{i + 1}</span>
              <span className="text-2xl">{row.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">
                  {row.petName} {isMe && <span className="text-primary">(you)</span>}
                </p>
                <p className="truncate text-xs font-semibold text-muted-foreground">
                  @{row.username} · {rank.emoji} {rank.name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-extrabold">{row.elo}</p>
                <p className="text-xs font-semibold text-muted-foreground">{row.wins}W</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
