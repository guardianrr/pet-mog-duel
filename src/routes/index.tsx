import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Crown, Heart, Share2, Sparkles, Trophy, Users, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { OpponentStage, WebcamStage } from "@/components/PetStage";
import { shareCard } from "@/lib/share-card";
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
  saveProfile,
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

const HERO_PETS = [
  {
    src: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80",
    alt: "A smiling golden retriever looking at the camera",
  },
  {
    src: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80",
    alt: "A grey cat with green eyes sitting calmly",
  },
  {
    src: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80",
    alt: "A black and white dog with a happy open-mouth smile",
  },
  {
    src: "https://images.unsplash.com/photo-1574158623369-27d808466b60?auto=format&fit=crop&w=900&q=80",
    alt: "A fluffy tabby cat with bright blue eyes",
  },
];

const EXAMPLE_DUELS = [
  {
    winner: {
      name: "Waffle",
      score: "9.4",
      src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80",
      alt: "A golden retriever outdoors with a big grin",
    },
    loser: {
      name: "Mochi",
      score: "8.1",
      src: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=600&q=80",
      alt: "A fluffy grey and white cat looking toward the camera",
    },
    line: "Certified fluff superiority.",
  },
  {
    winner: {
      name: "Biscuit",
      score: "9.1",
      src: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80",
      alt: "A cream-colored puppy wearing a pale sweater",
    },
    loser: {
      name: "Noodle",
      score: "7.6",
      src: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=600&q=80",
      alt: "A small white rabbit sitting on a wooden surface",
    },
    line: "Total cuteness domination.",
  },
];

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

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

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
      saveProfile(next);
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
    saveProfile(next);
  };

  return (
    <div>
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4">
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
          <section className="card-soft relative mt-6 overflow-hidden p-10 text-center animate-pop sm:p-14">
            <div className="pointer-events-none absolute inset-0 animate-shimmer opacity-60" />
            <div className="relative mx-auto mb-6 flex justify-center -space-x-6">
              {HERO_PETS.slice(0, 3).map((pet, i) => (
                <img
                  key={pet.src}
                  src={pet.src}
                  alt={pet.alt}
                  className="size-20 rounded-full border-4 border-background object-cover shadow-pop sm:size-24"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <div className="relative flex justify-center gap-3 text-5xl">
              <span className="animate-float">🐶</span>
              <span className="animate-wiggle">✨</span>
              <span className="animate-float [animation-delay:0.4s]">🐱</span>
            </div>
            <h2 className="relative mt-5 font-display text-2xl font-extrabold sm:text-3xl">
              {friendCode ? `Connecting to code ${friendCode}…` : "Finding a worthy opponent…"}
            </h2>
            <p className="relative mt-2 text-sm font-semibold text-muted-foreground">
              Sniffing around the lobby 🐾
            </p>
            <Progress value={66} className="relative mx-auto mt-6 h-2.5 w-56" />
          </section>
        )}

        {(phase === "duel" || phase === "analyzing") && (
          <section className="mt-4 space-y-5">
            <div className="text-center">
              {phase === "duel" ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
                    Duel in progress
                  </p>
                  <div className="relative mx-auto mt-2 grid size-32 place-items-center sm:size-40">
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
                      <circle
                        cx="50"
                        cy="50"
                        r="44"
                        fill="none"
                        stroke="currentColor"
                        className="text-muted"
                        strokeWidth="6"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="44"
                        fill="none"
                        stroke="currentColor"
                        className="text-primary transition-[stroke-dasharray] duration-700"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${(countdown / 15) * 276} 276`}
                      />
                    </svg>
                    <p
                      key={countdown}
                      className="font-display text-6xl font-extrabold text-gradient animate-pop sm:text-7xl"
                    >
                      {countdown}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-muted-foreground">
                    Show that pet! Wiggle, boop, maximum fluff.
                  </p>
                </>
              ) : (
                <div className="card-soft mx-auto max-w-md space-y-3 p-6">
                  <p className="font-display text-2xl font-extrabold">AI is analyzing the pets…</p>
                  <Progress value={analyze} className="h-3" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    {analyze < 40
                      ? "Measuring fluff density…"
                      : analyze < 75
                        ? "Detecting zoomies potential…"
                        : "Calculating vibe score…"}
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
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

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 text-center text-xs font-semibold text-muted-foreground">
        <p>For fun only — no pets were ranked seriously. 18+ recommended, be kind out there.</p>
        <p className="mt-1">Your camera is only used live during a duel and is never recorded or stored.</p>
      </footer>
    </div>
  );
}

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
    <div className="space-y-12">
      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[2rem] p-6 text-center sm:p-10 lg:text-left animate-pop">
          <div className="pointer-events-none absolute -left-8 top-8 text-6xl opacity-40 animate-float">🐩</div>
          <div className="pointer-events-none absolute -right-4 bottom-6 text-6xl opacity-40 animate-float [animation-delay:1s]">
            🐈
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-extrabold text-accent-foreground shadow-soft">
            <span className="live-dot" />
            <Users className="size-3.5" /> {props.online.toLocaleString()} pets online
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
            Who&apos;s the cutest?{" "}
            <span className="text-gradient">Let the pets decide.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base font-semibold text-muted-foreground sm:text-lg lg:mx-0">
            A 15-second webcam duel between two pets. The AI scores cuteness, energy and fluff — one of you
            mogs, one gets mogged.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 lg:items-start">
            <Button
              size="lg"
              onClick={props.onStart}
              className="h-14 w-full rounded-full text-lg font-extrabold shadow-pop transition-transform hover:scale-[1.03] sm:w-auto sm:px-14"
            >
              <Sparkles className="size-5" /> Start Duel
            </Button>
            <p className="text-xs font-semibold text-muted-foreground">
              Playing as <span className="font-bold text-foreground">{props.profile.username}</span> ·{" "}
              {props.rank.emoji} {props.rank.name} · {props.profile.elo} ELO
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {HERO_PETS.map((pet, i) => (
            <figure
              key={pet.src}
              className={`photo-frame hover-lift ${i % 2 === 1 ? "mt-6" : ""}`}
            >
              <img
                src={pet.src}
                alt={pet.alt}
                width={450}
                height={450}
                className="aspect-square w-full object-cover"
              />
            </figure>
          ))}
        </div>
      </section>

      <section>
        <p className="text-center text-xs font-extrabold uppercase tracking-[0.28em] text-muted-foreground">
          How it works
        </p>
        <h2 className="mt-1 text-center font-display text-3xl font-extrabold sm:text-4xl">
          Four fluffy steps
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Sparkles, title: "Tap Start Duel", body: "Get matched instantly with a stranger — or a friend." },
            { icon: Camera, title: "15 seconds of fame", body: "Show your pet on camera. Wiggle, boop, maximum fluff." },
            { icon: Zap, title: "AI scores the vibe", body: "Cuteness, energy, fluff and overall aura — judged in a blink." },
            { icon: Trophy, title: "Climb the ranks", body: "Win ELO, unlock titles, and share your result card." },
          ].map((step, i) => (
            <li key={step.title} className="card-soft hover-lift space-y-3 p-5">
              <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-primary/15 font-display text-lg font-extrabold text-primary">
                {i + 1}
              </span>
              <step.icon className="size-5 text-primary" />
              <h3 className="text-lg font-extrabold">{step.title}</h3>
              <p className="text-sm font-semibold text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card-soft space-y-4 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Heart className="size-5 text-primary" />
            <h2 className="text-xl font-extrabold">Duel a friend</h2>
          </div>
          <p className="text-sm font-semibold text-muted-foreground">
            Create a 6-digit code, share it, then both of you jump in.
          </p>
          <Button variant="secondary" className="w-full rounded-full font-bold" onClick={props.onCreateCode}>
            Create friend code
          </Button>
          {props.friendCode && (
            <p className="rounded-2xl bg-muted px-4 py-3 text-center font-display text-3xl font-extrabold tracking-[0.3em] animate-pop">
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

        <div className="card-soft space-y-4 p-6 sm:p-8">
          <h2 className="text-xl font-extrabold">Match settings</h2>
          <p className="text-sm font-semibold text-muted-foreground">
            Little extras so every duel feels just right.
          </p>
          <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
            <span className="text-sm font-bold">Sound effects</span>
            <Switch checked={props.sound} onCheckedChange={props.onSound} />
          </div>
          {props.nextRankName && (
            <p className="text-sm font-semibold text-muted-foreground">
              Next rank to unlock: <span className="font-extrabold text-foreground">{props.nextRankName}</span>
            </p>
          )}
          <p className="rounded-2xl bg-accent/60 px-4 py-3 text-sm font-semibold text-accent-foreground">
            Camera stays on-device. Nothing is recorded or uploaded.
          </p>
        </div>
      </section>

      <section>
        <p className="text-center text-xs font-extrabold uppercase tracking-[0.28em] text-muted-foreground">
          Example results
        </p>
        <h2 className="mt-1 text-center font-display text-3xl font-extrabold sm:text-4xl">
          This is what a mog looks like
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {EXAMPLE_DUELS.map((duel) => (
            <article key={duel.winner.name} className="card-soft hover-lift overflow-hidden p-5">
              <p className="text-center text-xs font-extrabold uppercase tracking-[0.22em] text-win">
                {duel.line}
              </p>
              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="text-center">
                  <img
                    src={duel.winner.src}
                    alt={duel.winner.alt}
                    className="mx-auto aspect-square w-full max-w-36 rounded-3xl object-cover shadow-soft"
                  />
                  <p className="mt-2 font-extrabold">{duel.winner.name}</p>
                  <p className="font-display text-2xl font-extrabold text-win">{duel.winner.score}</p>
                </div>
                <span className="font-display text-xl font-extrabold text-muted-foreground">VS</span>
                <div className="text-center">
                  <img
                    src={duel.loser.src}
                    alt={duel.loser.alt}
                    className="mx-auto aspect-square w-full max-w-36 rounded-3xl object-cover opacity-90 shadow-soft"
                  />
                  <p className="mt-2 font-extrabold">{duel.loser.name}</p>
                  <p className="font-display text-2xl font-extrabold text-muted-foreground">{duel.loser.score}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="text-center text-xs font-extrabold uppercase tracking-[0.28em] text-muted-foreground">
          Climb the ladder
        </p>
        <h2 className="mt-1 text-center font-display text-3xl font-extrabold sm:text-4xl">Ranks</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RANKS.map((r) => {
            const current = r.name === props.rank.name;
            return (
              <li
                key={r.name}
                className={`card-soft hover-lift flex items-center justify-between gap-3 p-4 ${
                  current ? "ring-2 ring-primary" : ""
                }`}
              >
                <div>
                  <p className="font-extrabold">
                    {r.emoji} {r.name}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground">{r.min}+ ELO</p>
                </div>
                {current && (
                  <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground">
                    You
                  </span>
                )}
              </li>
            );
          })}
        </ul>
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
          <div className="h-full bg-primary transition-[width] duration-700" style={{ width: `${(mine / (mine + theirs)) * 100}%` }} />
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
    <section className="mt-4 space-y-5 animate-pop">
      <div className="card-soft relative overflow-hidden p-6 text-center sm:p-10">
        <div className="pointer-events-none absolute -right-6 -top-6 text-7xl opacity-20">
          {result.won ? "👑" : "😿"}
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
          {result.won ? "Mogger" : "Mogged"}
        </p>
        <h1 className={`mt-2 font-display text-3xl font-extrabold sm:text-5xl ${result.won ? "text-win" : "text-lose"}`}>
          {result.line}
        </h1>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">
          {profile.petName} {result.mine.overall.toFixed(1)} — {result.theirs.overall.toFixed(1)}{" "}
          {opponent.petName} {opponent.emoji}
        </p>

        <div className="mt-7 space-y-4 rounded-3xl bg-muted/60 p-4 sm:p-6">
          <ScoreRow label="Cuteness" mine={result.mine.cuteness} theirs={result.theirs.cuteness} />
          <ScoreRow label="Energy" mine={result.mine.energy} theirs={result.theirs.energy} />
          <ScoreRow label="Fluff" mine={result.mine.fluff} theirs={result.theirs.fluff} />
          <ScoreRow label="Overall" mine={result.mine.overall} theirs={result.theirs.overall} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span
            className={`rounded-full px-5 py-2 font-display text-xl font-extrabold shadow-soft ${
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
          className="mt-7 h-12 w-full rounded-full text-base font-extrabold shadow-pop sm:w-auto sm:px-12"
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
