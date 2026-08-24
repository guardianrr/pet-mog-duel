import { useEffect, useRef, useState } from "react";
import { CameraOff, Loader2 } from "lucide-react";

export function WebcamStage({ label, active }: { label: string; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "on" | "error">("idle");

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    setState("loading");
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setState("on");
      })
      .catch(() => setState("error"));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[1.75rem] border-2 border-white/70 bg-muted shadow-pop animate-glow">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="h-full w-full scale-x-[-1] object-cover"
      />
      {state !== "on" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
          {state === "loading" ? (
            <Loader2 className="size-7 animate-spin" />
          ) : (
            <CameraOff className="size-7" />
          )}
          <p className="text-xs font-semibold">
            {state === "error" ? "Camera unavailable — the duel still runs!" : "Waking up the camera…"}
          </p>
        </div>
      )}
      <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest backdrop-blur">
        <span className="live-dot" /> Live
      </span>
      <span className="absolute bottom-2 left-2 max-w-[90%] truncate rounded-full bg-background/85 px-3 py-1 text-xs font-bold shadow-soft backdrop-blur">
        {label}
      </span>
    </div>
  );
}

export function OpponentStage({ label, emoji }: { label: string; emoji: string }) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[1.75rem] border-2 border-white/70 bg-gradient-to-br from-secondary via-accent to-muted shadow-pop">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="animate-float text-7xl sm:text-8xl">{emoji}</span>
      </div>
      <div className="absolute inset-x-0 top-2 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur">
          <span className="live-dot" /> live
        </span>
      </div>
      <span className="absolute bottom-2 left-2 max-w-[90%] truncate rounded-full bg-background/85 px-3 py-1 text-xs font-bold shadow-soft backdrop-blur">
        {label}
      </span>
    </div>
  );
}
