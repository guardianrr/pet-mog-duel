import type { Scores } from "./petmog";

type CardData = {
  petName: string;
  opponentPet: string;
  scores: Scores;
  oppScores: Scores;
  won: boolean;
  elo: number;
  delta: number;
  rank: string;
  rankEmoji: string;
};

function roundRect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

export function renderShareCard(d: CardData): HTMLCanvasElement {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d")!;

  const bg = c.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#ffe3ef");
  bg.addColorStop(0.5, "#fff6e0");
  bg.addColorStop(1, "#dff2ff");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  for (const [x, y, r, col] of [
    [140, 220, 180, "rgba(255,150,190,0.35)"],
    [960, 420, 220, "rgba(140,200,255,0.32)"],
    [220, 1180, 200, "rgba(150,235,200,0.35)"],
  ] as [number, number, number, string][]) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }

  c.textAlign = "center";
  c.fillStyle = "#7a2b53";
  c.font = "700 46px Nunito, system-ui, sans-serif";
  c.fillText("🐾 PetMog", W / 2, 110);
  c.fillStyle = "#a05c7b";
  c.font = "600 30px Nunito, system-ui, sans-serif";
  c.fillText("Who's the cutest? Let the pets decide.", W / 2, 158);

  c.fillStyle = d.won ? "#1f8a5b" : "#c0392b";
  c.font = "800 96px Nunito, system-ui, sans-serif";
  c.fillText(d.won ? "MOGGER" : "MOGGED", W / 2, 290);

  c.fillStyle = "#4a2338";
  c.font = "700 40px Nunito, system-ui, sans-serif";
  c.fillText(`${d.petName}  vs  ${d.opponentPet}`, W / 2, 355);

  // score panel
  roundRect(c, 90, 400, W - 180, 470, 44);
  c.fillStyle = "rgba(255,255,255,0.82)";
  c.fill();

  const rows: [string, number, number][] = [
    ["Cuteness", d.scores.cuteness, d.oppScores.cuteness],
    ["Energy", d.scores.energy, d.oppScores.energy],
    ["Fluff", d.scores.fluff, d.oppScores.fluff],
    ["Overall", d.scores.overall, d.oppScores.overall],
  ];
  rows.forEach(([label, mine, theirs], i) => {
    const y = 490 + i * 105;
    c.textAlign = "center";
    c.fillStyle = "#6b3b55";
    c.font = "600 34px Nunito, system-ui, sans-serif";
    c.fillText(label, W / 2, y);
    c.textAlign = "left";
    c.fillStyle = mine >= theirs ? "#1f8a5b" : "#8a8390";
    c.font = "800 52px Nunito, system-ui, sans-serif";
    c.fillText(mine.toFixed(1), 150, y + 10);
    c.textAlign = "right";
    c.fillStyle = theirs > mine ? "#1f8a5b" : "#8a8390";
    c.fillText(theirs.toFixed(1), W - 150, y + 10);
  });

  // elo + rank
  roundRect(c, 90, 910, W - 180, 210, 44);
  c.fillStyle = "rgba(255,255,255,0.82)";
  c.fill();
  c.textAlign = "center";
  c.fillStyle = d.delta >= 0 ? "#1f8a5b" : "#c0392b";
  c.font = "800 74px Nunito, system-ui, sans-serif";
  c.fillText(`${d.delta >= 0 ? "+" : ""}${d.delta} ELO`, W / 2, 1000);
  c.fillStyle = "#4a2338";
  c.font = "700 40px Nunito, system-ui, sans-serif";
  c.fillText(`${d.rankEmoji} ${d.rank} · ${d.elo}`, W / 2, 1068);

  c.fillStyle = "#7a2b53";
  c.font = "800 54px Nunito, system-ui, sans-serif";
  c.fillText("Play PetMog", W / 2, 1210);
  c.fillStyle = "#a05c7b";
  c.font = "600 30px Nunito, system-ui, sans-serif";
  c.fillText("Duel your pet. Claim the crown.", W / 2, 1262);

  return canvas;
}

export async function shareCard(data: CardData) {
  const canvas = renderShareCard(data);
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/png"));
  if (!blob) return "failed" as const;
  const file = new File([blob], "petmog-result.png", { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "PetMog",
        text: "My pet just duelled on PetMog 🐾",
      });
      return "shared" as const;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled" as const;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "petmog-result.png";
  a.click();
  URL.revokeObjectURL(url);
  return "downloaded" as const;
}
