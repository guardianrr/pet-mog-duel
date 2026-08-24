import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crown, Heart, Share2, Sparkles, Trophy, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/ThemeToggle";
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
        line: (won ? WIN_LINES : LOSS_LINES)[Math.floor(Math.random() * 4)],
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
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="font-display text-2xl font-extrabold text-gradient">PetMog</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="rounded-full font-bold">
            <Link to="/leaderboard">
              <Trophy className="size-4" /> <span className="hidden sm:inline">Leaderboard</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-full font-bold">
            <Link to="/profile">
              <Heart className="size-4" /> <span className="hidden sm:inline">Profile</span>
            </Link>
          </Button>
          <ThemeToggle />
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-16">
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
          <section className="card-soft mt-8 flex flex-col items-center gap-4 p-10 text-center animate-pop">
            <div className="flex gap-3 text-5xl">
              <span className="animate-float">🐶</span>
              <span className="animate-float [animation-delay:0.4s]">🐱</span>
            </div>
            <h2 className="text-2xl font-extrabold">
              {friendCode ? `Connecting to code ${friendCode}…` : "Finding a worthy opponent…"}
            </h2>
            <p className="text-sm text-muted-foreground">Sniffing around the lobby 🐾</p>
            <Progress value={66} className="h-2 w-56" />
          </section>
        )}

        {(phase === "duel" || phase === "analyzing") && (
          <section className="mt-6 space-y-5">
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

function Home(props: {
  online: number;
  profile: Profile;
  rank: { name: string; emoji: string };
  nextRankName?: string;
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
    <div className="space-y-8">
      <section className="card-soft relative overflow-hidden p-6 text-center sm:p-12 animate-pop">
        <div className="pointer-events-none absolute -left-6 top-6 text-5xl opacity-70 animate-float">🐩</div>
        <div className="pointer-events-none absolute -right-4 bottom-8 text-5xl opacity-70 animate-float [animation-delay:1s]">
          🐈
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1 text-xs font-bold text-accent-foreground">
          <Users className="size-3.5" /> {props.online.toLocaleString()} pets online
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-6xl">
          Who&apos;s the cutest? <span className="text-gradient">Let the pets decide.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm font-semibold text-muted-foreground sm:text-base">
          A 15-second webcam duel between two pets. The AI scores cuteness, energy and fluff — one of you
          mogs, one gets mogged.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Button size="lg" onClick={props.onStart} className="w-full rounded-full text-lg font-extrabold sm:w-auto sm:px-12">
            <Sparkles className="size-5" /> Start Duel
          </Button>
          <p className="text-xs text-muted-foreground">
            Playing as <span className="font-bold text-foreground">{props.profile.username}</span> ·{" "}
            {props.rank.emoji} {props.rank.name} · {props.profile.elo} ELO
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card-soft space-y-3 p-6">
          <h2 className="text-lg font-extrabold">Duel a friend</h2>
          <Button variant="secondary" className="w-full rounded-full font-bold" onClick={props.onCreateCode}>
            Create friend code
          </Button>
          {props.friendCode && (
            <p className="rounded-2xl bg-muted px-4 py-3 text-center font-display text-3xl font-extrabold tracking-[0.3em]">
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

        <div className="card-soft space-y-3 p-6">
          <h2 className="text-lg font-extrabold">How it works</h2>
          <ol className="space-y-2 text-sm font-semibold text-muted-foreground">
            <li>1. Tap Start Duel and get matched instantly.</li>
            <li>2. Show your pet on camera for 15 seconds.</li>
            <li>3. The AI scores cuteness, energy, fluff & vibe.</li>
            <li>4. Win ELO, climb ranks, share your card.</li>
          </ol>
          <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
            <span className="text-sm font-bold">Sound effects</span>
            <Switch checked={props.sound} onCheckedChange={props.onSound} />
          </div>
          {props.nextRankName && (
            <p className="text-xs text-muted-foreground">
              Next rank to unlock: <span className="font-bold text-foreground">{props.nextRankName}</span>
            </p>
          )}
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
        <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${(mine / (mine + theirs)) * 100}%` }} />
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
    <section className="mt-6 space-y-5 animate-pop">
      <div className="card-soft p-6 text-center sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
          {result.won ? "Mogger" : "Mogged"}
        </p>
        <h1 className={`mt-2 font-display text-3xl font-extrabold sm:text-5xl ${result.won ? "text-win" : "text-lose"}`}>
          {result.line}
        </h1>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          {profile.petName} {result.mine.overall.toFixed(1)} — {result.theirs.overall.toFixed(1)}{" "}
          {opponent.petName} {opponent.emoji}
        </p>

        <div className="mt-6 space-y-3">
          <ScoreRow label="Cuteness" mine={result.mine.cuteness} theirs={result.theirs.cuteness} />
          <ScoreRow label="Energy" mine={result.mine.energy} theirs={result.theirs.energy} />
          <ScoreRow label="Fluff" mine={result.mine.fluff} theirs={result.theirs.fluff} />
          <ScoreRow label="Overall" mine={result.mine.overall} theirs={result.theirs.overall} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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
          className="mt-6 w-full rounded-full text-base font-extrabold sm:w-auto sm:px-10"
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
