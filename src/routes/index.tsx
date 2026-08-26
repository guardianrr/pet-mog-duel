import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Crown, Share2, Sparkles, Timer, Trophy, Users, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { SiteHeader } from "@/components/SiteHeader";
import { OpponentStage, WebcamStage } from "@/components/PetStage";
import { shareCard } from "@/lib/share-card";
import { persistProfile, useCloudProfileSync } from "@/lib/cloud-profile";
import { useSession } from "@/lib/session";
import heroPets from "@/assets/hero-pets.jpg";
import petDog from "@/assets/pet-dog.jpg";
import petCat from "@/assets/pet-cat.jpg";
import petBunny from "@/assets/pet-bunny.jpg";
import {
  beep,
  eloDelta,
  LOSS_LINES,
  loadProfile,
  makeCode,
  nextRank,
  randomOpponent,
  rankFor,
  RANKS,
  rollScores,
  WIN_LINES,
  type Profile,
  type Scores,
} from "@/lib/petmog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PetMog — Who's the cutest? Let the pets decide." },
      {
        name: "description",
        content:
          "PetMog is a 15-second webcam pet duel. Match with a stranger or a friend code, get your pet scored on cuteness, energy and fluff, then climb the ranks.",
      },
      { property: "og:title", content: "PetMog — 1v1 pet cuteness duels" },
      {
        property: "og:description",
        content: "Show your pet, duel in 15 seconds, and find out who gets mogged. Free and just for fun.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PetMog,
});

type Phase = "home" | "matching" | "duel" | "analyzing" | "results";

function PetMog() {
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [phase, setPhase] = useState<Phase>("home");
  const [opponent, setOpponent] = useState(() => randomOpponent());
  const [countdown, setCountdown] = useState(15);
  const [analyze, setAnalyze] = useState(0);
  const [result, setResult] = useState<{
    mine: Scores;
    theirs: Scores;
    won: boolean;
    delta: number;
    line: string;
  } | null>(null);
  const [friendCode, setFriendCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [online, setOnline] = useState(1287);
  const timers = useRef<number[]>([]);
  const { user } = useSession();

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  useCloudProfileSync(user?.id, setProfile);

  useEffect(() => {
    const id = window.setInterval(
      () => setOnline((n) => Math.max(600, n + Math.round((Math.random() - 0.45) * 24))),
      2600,
    );
    return () => window.clearInterval(id);
  }, []);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const rank = rankFor(profile.elo);
  const upcoming = nextRank(profile.elo);

  const finish = useCallback(
    (opp: { elo: number }) => {
      const mine = rollScores();
      const theirs = rollScores();
      const won = mine.overall >= theirs.overall;
      const delta = eloDelta(profile.elo, opp.elo, won);
      const next: Profile = {
        ...profile,
        elo: Math.max(600, profile.elo + delta),
        wins: profile.wins + (won ? 1 : 0),
        losses: profile.losses + (won ? 0 : 1),
      };
      next.peakElo = Math.max(next.peakElo, next.elo);
      setProfile(next);
      persistProfile(next);
      setResult({
        mine,
        theirs,
        won,
        delta,
        line: (won ? WIN_LINES : LOSS_LINES)[Math.floor(Math.random() * 4)]!,
      });
      beep(won ? 880 : 220, 0.25, profile.sound);
      setPhase("results");
    },
    [profile],
  );

  const startDuel = useCallback(
    (code?: string) => {
      clearTimers();
      const opp = randomOpponent();
      setOpponent(opp);
      setResult(null);
      setFriendCode(code ?? null);
      setPhase("matching");
      beep(660, 0.1, profile.sound);
      timers.current.push(
        window.setTimeout(() => {
          setPhase("duel");
          setCountdown(15);
        }, 1900),
      );
    },
    [profile.sound],
  );

  // duel countdown
  useEffect(() => {
    if (phase !== "duel") return;
    if (countdown <= 0) {
      setPhase("analyzing");
      setAnalyze(0);
      return;
    }
    const id = window.setTimeout(() => {
      if (countdown <= 4) beep(520, 0.07, profile.sound);
      setCountdown((c) => c - 1);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [phase, countdown, profile.sound]);

  // analyzing progress
  useEffect(() => {
    if (phase !== "analyzing") return;
    const id = window.setInterval(() => setAnalyze((p) => Math.min(100, p + 4)), 70);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "analyzing" && analyze >= 100) finish(opponent);
  }, [phase, analyze, finish, opponent]);

  const updateProfile = (patch: Partial<Profile>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    persistProfile(next);
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className={phase === "home" ? "pb-16" : "mx-auto w-full max-w-5xl px-4 pb-16"}>
        {phase === "home" && (
          <Home
            online={online}
            profile={profile}
            rank={rank}
            nextRankName={upcoming?.name}
            onStart={() => startDuel()}
            onCreateCode={() => {
              const code = makeCode();
              setFriendCode(code);
              navigator.clipboard?.writeText(code).catch(() => undefined);
              toast.success(`Friend code ${code} copied!`, { description: "Share it, then start the duel." });
            }}
            friendCode={friendCode}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            onJoin={() => {
              if (joinCode.trim().length !== 6) {
                toast.error("Friend codes are 6 digits");
                return;
              }
              startDuel(joinCode.trim());
            }}
            sound={profile.sound}
            onSound={(v) => updateProfile({ sound: v })}
          />
        )}

        {phase === "matching" && (
          <section className="card-soft mt-10 flex flex-col items-center gap-4 p-10 text-center animate-pop">
            <div className="flex gap-3 text-5xl">
              <span className="animate-float">🐶</span>
              <span className="animate-float [animation-delay:0.4s]">🐱</span>
            </div>
            <h2 className="font-display text-2xl font-extrabold">
              {friendCode ? `Connecting to code ${friendCode}…` : "Finding a worthy opponent…"}
            </h2>
            <p className="text-sm font-semibold text-muted-foreground">Sniffing around the lobby 🐾</p>
            <Progress value={66} className="h-2 w-56" />
          </section>
        )}

        {(phase === "duel" || phase === "analyzing") && (
          <section className="mt-8 space-y-5">
            <div className="text-center">
              {phase === "duel" ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
                    Duel in progress
                  </p>
                  <p
                    key={countdown}
                    className="font-display text-7xl font-extrabold text-gradient animate-pop sm:text-8xl"
                  >
                    {countdown}
                  </p>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Show that pet! Wiggle, boop, maximum fluff.
                  </p>
                </>
              ) : (
                <div className="mx-auto max-w-md space-y-3">
                  <p className="font-display text-2xl font-extrabold">AI is analyzing the pets…</p>
                  <Progress value={analyze} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {analyze < 40
                      ? "Measuring fluff density…"
                      : analyze < 75
                        ? "Detecting zoomies potential…"
                        : "Calculating vibe score…"}
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              <WebcamStage label={`You · ${profile.petName}`} active />
              <OpponentStage label={`${opponent.petName} · ${opponent.username}`} emoji={opponent.emoji} />
            </div>
            <div className="text-center">
              <Button
                variant="ghost"
                className="rounded-full font-bold"
                onClick={() => {
                  clearTimers();
                  setPhase("home");
                }}
              >
                Leave duel
              </Button>
            </div>
          </section>
        )}

        {phase === "results" && result && (
          <Results
            profile={profile}
            opponent={opponent}
            result={result}
            onRematch={() => startDuel(friendCode ?? undefined)}
            onNew={() => startDuel()}
            onHome={() => setPhase("home")}
          />
        )}
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 pb-10 text-center text-xs text-muted-foreground">
        <p>For fun only — no pets were ranked seriously. 18+ recommended, be kind out there.</p>
        <p className="mt-1">Your camera is only used live during a duel and is never recorded or stored.</p>
      </footer>
    </div>
  );
}

const STEPS = [
  { icon: Users, title: "Get matched", body: "Tap Start Duel and meet a random pet — or use a friend code." },
  { icon: Camera, title: "Show your pet", body: "15 seconds of pure fluff on camera. Wiggle, boop, repeat." },
  { icon: Wand2, title: "AI scores it", body: "Cuteness, energy, fluff and overall vibe, judged instantly." },
  { icon: Trophy, title: "Climb the ranks", body: "Win ELO, unlock rank badges and share your result card." },
];

const GALLERY = [
  { src: petDog, alt: "Golden retriever puppy contestant", name: "Waffle", score: "9.4" },
  { src: petCat, alt: "Fluffy white kitten contestant", name: "Mochi", score: "9.1" },
  { src: petBunny, alt: "Lop-eared bunny contestant", name: "Noodle", score: "8.8" },
];

function Home(props: {
  online: number;
  profile: Profile;
  rank: { name: string; emoji: string };
  nextRankName?: string | undefined;
  onStart: () => void;
  onCreateCode: () => void;
  friendCode: string | null;
  joinCode: string;
  setJoinCode: (v: string) => void;
  onJoin: () => void;
  sound: boolean;
  onSound: (v: boolean) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      {/* Hero */}
      <section className="relative mt-6 grid items-center gap-8 lg:mt-10 lg:grid-cols-2 lg:gap-12">
        <div className="animate-pop text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-bold text-foreground shadow-sm backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-win opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-win" />
            </span>
            {props.online.toLocaleString()} pets online right now
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
            Who&apos;s the cutest?{" "}
            <span className="text-gradient">Let the pets decide.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base font-semibold text-muted-foreground lg:mx-0 sm:text-lg">
            A 15-second webcam duel between two pets. Our AI scores cuteness, energy and fluff — one of you
            mogs, one gets mogged.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Button
              size="lg"
              onClick={props.onStart}
              className="w-full rounded-full text-lg font-extrabold shadow-[var(--shadow-pop)] transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:px-12"
            >
              <Sparkles className="size-5" /> Start Duel
            </Button>
            <div className="flex items-center gap-2 rounded-full bg-card/70 px-4 py-2 text-xs font-bold text-muted-foreground backdrop-blur">
              <Timer className="size-4" /> 15 seconds · no signup needed
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-muted-foreground">
            Playing as <span className="font-extrabold text-foreground">{props.profile.username}</span> ·{" "}
            {props.rank.emoji} {props.rank.name} · {props.profile.elo} ELO
          </p>
        </div>

        <div className="relative animate-pop">
          <div className="card-soft overflow-hidden p-2 transition-transform duration-500 hover:-rotate-1">
            <img
              src={heroPets}
              alt="A corgi puppy and a grey kitten facing off in a PetMog duel"
              width={1280}
              height={960}
              className="h-full w-full rounded-[calc(var(--radius-3xl)-0.5rem)] object-cover"
            />
          </div>
          <div className="card-soft absolute -bottom-5 left-3 flex items-center gap-2 px-4 py-2 text-sm font-extrabold animate-float sm:left-6">
            <span className="text-xl">🏆</span> +24 ELO
          </div>
          <div className="card-soft absolute -top-5 right-3 flex items-center gap-2 px-4 py-2 text-sm font-extrabold animate-float [animation-delay:1.2s] sm:right-6">
            <span className="text-xl">☁️</span> Fluff 9.7
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-24">
        <h2 className="text-center font-display text-3xl font-extrabold sm:text-4xl">How PetMog works</h2>
        <p className="mt-2 text-center text-sm font-semibold text-muted-foreground">
          Four steps between you and total cuteness domination.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="card-soft group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-pop)]"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-transform group-hover:scale-110">
                <s.icon className="size-5" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Step {i + 1}
              </p>
              <h3 className="font-display text-xl font-extrabold">{s.title}</h3>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contenders gallery */}
      <section className="mt-24">
        <h2 className="text-center font-display text-3xl font-extrabold sm:text-4xl">
          Today&apos;s top contenders
        </h2>
        <p className="mt-2 text-center text-sm font-semibold text-muted-foreground">
          Real scores from recent duels. Think your pet can beat them?
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {GALLERY.map((p) => (
            <figure key={p.name} className="card-soft group overflow-hidden p-0">
              <div className="relative overflow-hidden">
                <img
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  width={768}
                  height={768}
                  className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute right-3 top-3 rounded-full bg-background/85 px-3 py-1 font-display text-sm font-extrabold backdrop-blur">
                  ⭐ {p.score}
                </span>
              </div>
              <figcaption className="flex items-center justify-between px-5 py-4">
                <span className="font-display text-lg font-extrabold">{p.name}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Verified fluff
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Ranks */}
      <section className="mt-24">
        <h2 className="text-center font-display text-3xl font-extrabold sm:text-4xl">Climb the ranks</h2>
        <p className="mt-2 text-center text-sm font-semibold text-muted-foreground">
          Every win pushes your pet closer to the crown.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RANKS.map((r) => {
            const isCurrent = r.name === props.rank.name;
            return (
              <div
                key={r.name}
                className={`card-soft flex items-center gap-4 p-5 transition-all duration-300 hover:-translate-y-1 ${
                  isCurrent ? "ring-2 ring-primary" : ""
                }`}
              >
                <span className="text-3xl">{r.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-extrabold">{r.name}</p>
                  <p className="text-xs font-semibold text-muted-foreground">{r.min}+ ELO</p>
                </div>
                {isCurrent && (
                  <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground">
                    You
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {props.nextRankName && (
          <p className="mt-4 text-center text-xs font-semibold text-muted-foreground">
            Next rank to unlock: <span className="font-extrabold text-foreground">{props.nextRankName}</span>
          </p>
        )}
      </section>

      {/* Friend duel + settings */}
      <section className="mt-24 grid gap-5 lg:grid-cols-2">
        <div className="card-soft space-y-4 p-7">
          <h2 className="font-display text-2xl font-extrabold">Duel a friend</h2>
          <p className="text-sm font-semibold text-muted-foreground">
            Generate a 6-digit code, send it over, and settle it once and for all.
          </p>
          <Button
            variant="secondary"
            className="w-full rounded-full font-bold transition-transform hover:-translate-y-0.5"
            onClick={props.onCreateCode}
          >
            Create friend code
          </Button>
          {props.friendCode && (
            <p className="animate-pop rounded-2xl bg-muted px-4 py-3 text-center font-display text-3xl font-extrabold tracking-[0.3em]">
              {props.friendCode}
            </p>
          )}
          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit code"
              value={props.joinCode}
              onChange={(e) => props.setJoinCode(e.target.value.replace(/\D/g, ""))}
              className="rounded-full"
            />
            <Button className="rounded-full font-bold" onClick={props.onJoin}>
              Join
            </Button>
          </div>
        </div>

        <div className="card-soft flex flex-col justify-between gap-4 p-7">
          <div>
            <h2 className="font-display text-2xl font-extrabold">Ready when you are</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              Free, fast and endlessly rematchable. Sign in to keep your rank on every device.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
            <span className="text-sm font-bold">Sound effects</span>
            <Switch checked={props.sound} onCheckedChange={props.onSound} />
          </div>
          <Button
            size="lg"
            onClick={props.onStart}
            className="w-full rounded-full text-lg font-extrabold transition-transform hover:-translate-y-0.5"
          >
            <Sparkles className="size-5" /> Start Duel
          </Button>
        </div>
      </section>
    </div>
  );
}

function ScoreRow({ label, mine, theirs }: { label: string; mine: number; theirs: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`w-12 text-right font-extrabold ${mine >= theirs ? "text-win" : "text-muted-foreground"}`}>
        {mine.toFixed(1)}
      </span>
      <div className="flex-1">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className="mt-1 flex h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-700"
            style={{ width: `${(mine / (mine + theirs)) * 100}%` }}
          />
          <div className="h-full flex-1 bg-secondary" />
        </div>
      </div>
      <span className={`w-12 font-extrabold ${theirs > mine ? "text-win" : "text-muted-foreground"}`}>
        {theirs.toFixed(1)}
      </span>
    </div>
  );
}

function Results(props: {
  profile: Profile;
  opponent: { petName: string; username: string; emoji: string };
  result: { mine: Scores; theirs: Scores; won: boolean; delta: number; line: string };
  onRematch: () => void;
  onNew: () => void;
  onHome: () => void;
}) {
  const { profile, opponent, result } = props;
  const rank = useMemo(() => rankFor(profile.elo), [profile.elo]);

  return (
    <section className="mt-8 space-y-5 animate-pop">
      <div className="card-soft relative overflow-hidden p-6 text-center sm:p-10">
        <div
          className={`pointer-events-none absolute inset-x-0 -top-24 h-48 blur-3xl ${
            result.won ? "bg-win/25" : "bg-lose/20"
          }`}
        />
        <p className="relative text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
          {result.won ? "Mogger" : "Mogged"}
        </p>
        <div className="relative mt-3 text-5xl">{result.won ? "🎉" : "😿"}</div>
        <h1
          className={`relative mt-2 font-display text-3xl font-extrabold sm:text-5xl ${
            result.won ? "text-win" : "text-lose"
          }`}
        >
          {result.line}
        </h1>
        <p className="relative mt-2 text-sm font-semibold text-muted-foreground">
          {profile.petName} {result.mine.overall.toFixed(1)} — {result.theirs.overall.toFixed(1)}{" "}
          {opponent.petName} {opponent.emoji}
        </p>

        <div className="relative mx-auto mt-8 max-w-md space-y-3">
          <ScoreRow label="Cuteness" mine={result.mine.cuteness} theirs={result.theirs.cuteness} />
          <ScoreRow label="Energy" mine={result.mine.energy} theirs={result.theirs.energy} />
          <ScoreRow label="Fluff" mine={result.mine.fluff} theirs={result.theirs.fluff} />
          <ScoreRow label="Overall" mine={result.mine.overall} theirs={result.theirs.overall} />
        </div>

        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <span
            className={`rounded-full px-4 py-2 font-display text-xl font-extrabold ${
              result.delta >= 0 ? "bg-accent text-win" : "bg-muted text-lose"
            }`}
          >
            {result.delta >= 0 ? "+" : ""}
            {result.delta} ELO
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground">
            <Crown className="size-4" /> {rank.emoji} {rank.name} · {profile.elo}
          </span>
        </div>

        <Button
          size="lg"
          className="relative mt-7 w-full rounded-full text-base font-extrabold shadow-[var(--shadow-pop)] transition-transform hover:-translate-y-0.5 sm:w-auto sm:px-10"
          onClick={async () => {
            const out = await shareCard({
              petName: profile.petName,
              opponentPet: opponent.petName,
              scores: result.mine,
              oppScores: result.theirs,
              won: result.won,
              elo: profile.elo,
              delta: result.delta,
              rank: rank.name,
              rankEmoji: rank.emoji,
            });
            if (out === "downloaded") toast.success("Share card saved to your device 🐾");
            if (out === "failed") toast.error("Could not build the share card");
          }}
        >
          <Share2 className="size-5" /> Share Result
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Button variant="secondary" className="rounded-full font-bold" onClick={props.onRematch}>
          Rematch
        </Button>
        <Button variant="secondary" className="rounded-full font-bold" onClick={props.onNew}>
          New Match
        </Button>
        <Button variant="ghost" className="rounded-full font-bold" onClick={props.onHome}>
          Back to Home
        </Button>
      </div>
    </section>
  );
}
