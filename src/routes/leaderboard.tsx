import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
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
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-extrabold text-accent-foreground">
          <Trophy className="size-3.5" /> Season standings
        </span>
        <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
          🏆 <span className="text-gradient">Top Pets</span>
        </h1>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">Ranked by duel ELO this season.</p>
      </div>

      {!profile && (
        <ul className="mt-8 space-y-2" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="card-soft h-20 animate-pulse" />
          ))}
        </ul>
      )}

      {profile && rows.length === 0 && (
        <div className="card-soft mt-8 p-10 text-center">
          <p className="text-4xl">🐾</p>
          <p className="mt-3 font-extrabold">No pets on the board yet</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Win a duel to claim your spot.</p>
        </div>
      )}

      {profile && rows.length > 0 && (
        <ul className="mt-8 space-y-2">
          {rows.map((row, i) => {
            const rank = rankFor(row.elo);
            const isMe = profile.username === row.username;
            return (
              <li
                key={`${row.username}-${i}`}
                className={`card-soft hover-lift flex items-center gap-3 p-4 ${
                  isMe ? "ring-2 ring-primary" : ""
                } ${i === 0 ? "bg-gradient-to-r from-lemon/40 to-transparent" : ""}`}
              >
                <span
                  className={`grid size-9 place-items-center rounded-2xl font-display text-lg font-extrabold ${
                    i === 0
                      ? "bg-lemon text-foreground"
                      : i === 1
                        ? "bg-muted"
                        : i === 2
                          ? "bg-secondary"
                          : "text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="grid size-11 place-items-center rounded-2xl bg-muted text-2xl">{row.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold">
                    {row.petName}{" "}
                    {isMe && (
                      <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-primary">
                        you
                      </span>
                    )}
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
      )}
    </div>
  );
}
