export type Scores = {
  cuteness: number;
  energy: number;
  fluff: number;
  overall: number;
};

export type Rank = {
  name: string;
  min: number;
  emoji: string;
};

export const RANKS: Rank[] = [
  { name: "Stray", min: 0, emoji: "🐾" },
  { name: "Good Boy/Girl", min: 950, emoji: "🦴" },
  { name: "Neighborhood Legend", min: 1100, emoji: "🏘️" },
  { name: "Absolute Unit", min: 1250, emoji: "🗿" },
  { name: "Fluff God", min: 1400, emoji: "☁️" },
  { name: "Supreme Overlord of Cuteness", min: 1600, emoji: "👑" },
];

export function rankFor(elo: number): Rank {
  let r = RANKS[0];
  for (const rank of RANKS) if (elo >= rank.min) r = rank;
  return r;
}

export function nextRank(elo: number): Rank | null {
  return RANKS.find((r) => r.min > elo) ?? null;
}

export type Profile = {
  username: string;
  petName: string;
  elo: number;
  wins: number;
  losses: number;
  peakElo: number;
  sound: boolean;
};

const KEY = "petmog:profile:v1";

export function defaultProfile(): Profile {
  return {
    username: `pet_${Math.floor(1000 + Math.random() * 9000)}`,
    petName: "My Pet",
    elo: 1000,
    wins: 0,
    losses: 0,
    peakElo: 1000,
    sound: true,
  };
}

export function loadProfile(): Profile {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProfile();
    return { ...defaultProfile(), ...JSON.parse(raw) } as Profile;
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(p: Profile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function eloDelta(playerElo: number, oppElo: number, won: boolean, k = 32) {
  const expected = 1 / (1 + Math.pow(10, (oppElo - playerElo) / 400));
  return Math.round(k * ((won ? 1 : 0) - expected));
}

const rnd = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 10) / 10;

export function rollScores(bias = 0): Scores {
  const cuteness = Math.min(10, Math.max(3, rnd(5.5, 9.6) + bias));
  const energy = Math.min(10, Math.max(3, rnd(4.8, 9.8) + bias));
  const fluff = Math.min(10, Math.max(3, rnd(4.5, 9.9) + bias));
  const overall = Math.round(((cuteness + energy + fluff) / 3) * 10) / 10;
  return { cuteness, energy, fluff, overall };
}

export const OPPONENTS = [
  { username: "waffle_the_corgi", petName: "Waffle", emoji: "🐶", elo: 1180 },
  { username: "mochi_mayhem", petName: "Mochi", emoji: "🐱", elo: 1042 },
  { username: "sir_biscuit", petName: "Biscuit", emoji: "🐕", elo: 1310 },
  { username: "noodle_bun", petName: "Noodle", emoji: "🐰", elo: 970 },
  { username: "captain_floof", petName: "Floof", emoji: "🐈", elo: 1455 },
  { username: "beans_ontoast", petName: "Beans", emoji: "🐹", elo: 1015 },
  { username: "gravy_goblin", petName: "Gravy", emoji: "🐩", elo: 1120 },
  { username: "duchess_pickle", petName: "Pickle", emoji: "🦜", elo: 890 },
];

export function randomOpponent() {
  return OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
}

export const WIN_LINES = [
  "Your pet just mogged them!",
  "Certified fluff superiority.",
  "Total cuteness domination.",
  "They never stood a chance.",
];

export const LOSS_LINES = [
  "You got mogged by a fluffy legend.",
  "Out-flufffed. It happens.",
  "Their pet had the aura today.",
  "Mogged. Rematch immediately.",
];

export function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

let ctx: AudioContext | null = null;
export function beep(freq: number, duration = 0.12, enabled = true) {
  if (!enabled || typeof window === "undefined") return;
  try {
    ctx = ctx ?? new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = 0.06;
    o.connect(g).connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    o.stop(ctx.currentTime + duration);
  } catch {
    /* ignore */
  }
}

export type LeaderRow = { username: string; petName: string; emoji: string; elo: number; wins: number };

export function leaderboard(profile: Profile): LeaderRow[] {
  const base: LeaderRow[] = [
    { username: "captain_floof", petName: "Floof", emoji: "🐈", elo: 1642, wins: 41 },
    { username: "sir_biscuit", petName: "Biscuit", emoji: "🐕", elo: 1510, wins: 33 },
    { username: "toast_crumb", petName: "Toast", emoji: "🐶", elo: 1444, wins: 28 },
    { username: "waffle_the_corgi", petName: "Waffle", emoji: "🐶", elo: 1380, wins: 25 },
    { username: "gravy_goblin", petName: "Gravy", emoji: "🐩", elo: 1291, wins: 22 },
    { username: "mochi_mayhem", petName: "Mochi", emoji: "🐱", elo: 1188, wins: 19 },
    { username: "beans_ontoast", petName: "Beans", emoji: "🐹", elo: 1102, wins: 14 },
    { username: "noodle_bun", petName: "Noodle", emoji: "🐰", elo: 1044, wins: 11 },
    { username: "duchess_pickle", petName: "Pickle", emoji: "🦜", elo: 962, wins: 7 },
  ];
  return [
    ...base,
    { username: profile.username, petName: profile.petName, emoji: "⭐", elo: profile.elo, wins: profile.wins },
  ].sort((a, b) => b.elo - a.elo);
}
