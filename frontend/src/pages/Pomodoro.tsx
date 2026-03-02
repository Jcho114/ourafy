import * as React from "react";
import { ArrowLeft, Loader2, SkipForward } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { unlockAudio, playPhaseCue } from "@/features/audio/beeps";
import { StepRail } from "@/components/lockin/StepRail";
import { usePomodoroMachine } from "@/features/pomodoro/usePomodoroMachine";
import type {
  PomodoroPhase,
  PomodoroSettings,
} from "@/features/pomodoro/usePomodoroMachine";

function clampInt(n: number, min: number, max: number) {
  const x = Math.round(Number.isFinite(n) ? n : min);
  return Math.min(max, Math.max(min, x));
}

function parseSettingsFromSearch(search: string): PomodoroSettings {
  const sp = new URLSearchParams(search);
  const onRaw = Number(sp.get("on"));
  const offRaw = Number(sp.get("off"));
  const cyclesRaw = Number(sp.get("cycles"));

  const on = clampInt(Number.isFinite(onRaw) ? onRaw : 25, 1, 240);
  const off = clampInt(Number.isFinite(offRaw) ? offRaw : 5, 1, 120);
  const cycles = clampInt(Number.isFinite(cyclesRaw) ? cyclesRaw : 4, 1, 50);

  return {
    focusMinutes: on,
    shortBreakMinutes: off,
    rounds: cycles,
  };
}

function parseFocusFromSearch(search: string) {
  const sp = new URLSearchParams(search);
  const raw = sp.get("focus");
  if (!raw) return "";
  return raw.slice(0, 150);
}

function parsePlaylistFromSearch(search: string) {
  const sp = new URLSearchParams(search);
  const raw = sp.get("playlist");
  if (!raw) return "";
  return raw.slice(0, 180);
}

function parseSetupTokenFromSearch(search: string) {
  const sp = new URLSearchParams(search);
  const raw = sp.get("setup");
  if (!raw) return "";
  return raw.slice(0, 120);
}

function openSetupStorageKey(token: string) {
  return `ourafy.openSetup:${token}`;
}

function openSetupDoneKey(token: string) {
  return `ourafy.openSetupDone:${token}`;
}

function playlistTipKey(playlist: string) {
  return `ourafy.playlistTipDismissed:${playlist}`;
}

function parseExtrasFromSearch(search: string) {
  const sp = new URLSearchParams(search);
  const blockers = (sp.get("blockers") ?? "").slice(0, 120);
  const appsRaw = (sp.get("apps") ?? "").slice(0, 300);
  const apps = appsRaw
    ? appsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];
  const rawReason = (sp.get("reason") ?? "").slice(0, 400);
  const reason = rawReason
    .replace(/\s*Recommended:\s*[^.]*\.?\s*/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return { blockers, apps, reason };
}

function formatClock(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function phaseLabel(phase: PomodoroPhase) {
  if (phase === "focus") return "FOCUS";
  if (phase === "shortBreak") return "SHORT BREAK";
  if (phase === "done") return "DONE";
  return "IDLE";
}

export default function Pomodoro() {
  const location = useLocation();
  const navigate = useNavigate();

  const settings = React.useMemo(
    () => parseSettingsFromSearch(location.search),
    [location.search],
  );

  const focus = React.useMemo(
    () => parseFocusFromSearch(location.search),
    [location.search],
  );

  const playlist = React.useMemo(
    () => parsePlaylistFromSearch(location.search),
    [location.search],
  );

  const setupToken = React.useMemo(
    () => parseSetupTokenFromSearch(location.search),
    [location.search],
  );

  const [isSettingUp, setIsSettingUp] = React.useState(() => Boolean(setupToken));
  const setupStartedRef = React.useRef(false);

  const [showPlaylistDialog, setShowPlaylistDialog] = React.useState(false);

  React.useEffect(() => {
    if (!playlist || isSettingUp) {
      setShowPlaylistDialog(false);
      return;
    }

    try {
      const seen = window.sessionStorage.getItem(playlistTipKey(playlist));
      setShowPlaylistDialog(!seen);
    } catch {
      setShowPlaylistDialog(true);
    }
  }, [isSettingUp, playlist]);

  const extras = React.useMemo(
    () => parseExtrasFromSearch(location.search),
    [location.search],
  );

  const { state, remainingMs, progress, controls } =
    usePomodoroMachine(settings);
  const lastPhaseRef = React.useRef<PomodoroPhase>("idle");

  const totalCycles = settings.rounds ?? 0;
  const currentCycle = React.useMemo(() => {
    if (state.phase === "idle") return 0;
    if (state.phase === "focus") return state.focusCompleted + 1;
    if (state.phase === "shortBreak") return state.focusCompleted;
    if (state.phase === "done") return totalCycles || state.focusCompleted;
    return state.focusCompleted;
  }, [state.focusCompleted, state.phase, totalCycles]);

  React.useEffect(() => {
    if (state.phase === lastPhaseRef.current) return;
    lastPhaseRef.current = state.phase;
    if (state.phase === "idle") return;
    playPhaseCue(state.phase === "done" ? "done" : state.phase);
  }, [state.phase]);

  React.useEffect(() => {
    if (state.phase !== "done") return;

    const apps = (extras.apps ?? []).filter(
      (a): a is string => typeof a === "string" && Boolean(a.trim()),
    );
    if (apps.length) {
      void axios
        .post("http://localhost:8000/close", { apps })
        .catch((err) => {
          console.error(err);
        });
    }

    toast.success("Done.");
    const id = window.setTimeout(() => {
      navigate("/");
    }, 900);
    return () => window.clearTimeout(id);
  }, [extras.apps, navigate, state.phase]);

  React.useEffect(() => {
    if (!setupToken) {
      setIsSettingUp(false);
      return;
    }

    if (setupStartedRef.current) return;
    setupStartedRef.current = true;

    try {
      const done = window.sessionStorage.getItem(openSetupDoneKey(setupToken));
      if (done) {
        setIsSettingUp(false);
        return;
      }
    } catch {
      // ignore
    }

    let raw = "";
    try {
      raw = window.sessionStorage.getItem(openSetupStorageKey(setupToken)) ?? "";
    } catch {
      raw = "";
    }

    if (!raw) {
      setIsSettingUp(false);
      return;
    }

    let body: unknown = null;
    try {
      body = JSON.parse(raw);
    } catch {
      body = null;
    }

    if (!body || typeof body !== "object") {
      setIsSettingUp(false);
      return;
    }

    setIsSettingUp(true);

    void axios
      .post("http://localhost:8000/open", body)
      .then(() => {
        try {
          window.sessionStorage.setItem(openSetupDoneKey(setupToken), "1");
          window.sessionStorage.removeItem(openSetupStorageKey(setupToken));
        } catch {
          // ignore
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Couldn't set up environment.");
      })
      .finally(() => {
        setIsSettingUp(false);
      });
  }, [setupToken]);

  React.useEffect(() => {
    if (isSettingUp) return;
    if (state.phase !== "idle" || state.status !== "stopped") return;
    controls.start();
  }, [controls, isSettingUp, state.phase, state.status]);

  return (
    <div className="min-h-screen w-full cyber-bg">
      {isSettingUp ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 backdrop-blur-sm">
          <div className="w-full max-w-md mx-auto rounded-2xl border border-border/60 bg-card/50 p-6 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_90px_rgba(0,0,0,0.55)]">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-background/25">
              <Loader2 className="size-7 animate-spin text-muted-foreground" />
            </div>
            <div className="mt-5 text-xs tracking-[0.28em] text-muted-foreground">
              SETTING UP ENVIRONMENT
            </div>
            <div className="mt-2 text-sm text-foreground/85">
              Opening apps and getting Spotify ready…
            </div>
          </div>
        </div>
      ) : null}

      <Dialog
        open={showPlaylistDialog}
        onOpenChange={(open) => {
          setShowPlaylistDialog(open);
          if (!open && playlist) {
            try {
              window.sessionStorage.setItem(playlistTipKey(playlist), "1");
            } catch {
              // ignore
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Spotify playlist</DialogTitle>
            <DialogDescription>
              When Spotify opens, select this playlist to start the session.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border/60 bg-background/35 p-4">
            <div className="text-xs tracking-[0.28em] text-muted-foreground">
              PICK THIS PLAYLIST
            </div>
            <div className="mt-2 font-mono text-sm break-words">{playlist}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Close this dialog with the X when you’re set.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-14">
        <StepRail
          className="mb-6 -mx-2"
          currentKey="timer"
          steps={[
            {
              key: "intake",
              label: "Pick Coach",
              sublabel: "Lifestyle coach",
            },
            {
              key: "snapshot",
              label: "Bio + Setup",
              sublabel: "Lock target + inputs",
            },
            {
              key: "options",
              label: "Pick A Plan",
              sublabel: "Pomodoro choices",
            },
            { key: "timer", label: "Timer", sublabel: "Run it" },
          ]}
        />

        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs tracking-[0.28em] text-muted-foreground">
              OURAFY / TIMER
            </div>
            <div className="text-2xl font-semibold">Pomodoro</div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              navigate(-1);
            }}
            className="border-border/60 bg-background/40 backdrop-blur"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="border-border/60 bg-card/40 backdrop-blur max-w-3xl mx-auto w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="tracking-wide">Timer</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-border/60 bg-background/30 px-2 py-1 text-xs font-mono">
                    {currentCycle}/{totalCycles}
                  </span>
                  <span className="rounded-md border border-border/60 bg-background/30 px-2 py-1 text-xs tracking-[0.2em]">
                    {phaseLabel(state.phase)}
                  </span>
                </div>
              </CardTitle>
              <CardDescription>
                {settings.focusMinutes} on / {settings.shortBreakMinutes} off ·{" "}
                {settings.rounds ?? "∞"} cycles
                {focus ? (
                  <span className="block mt-1 font-mono text-xs text-muted-foreground whitespace-pre-wrap break-words">
                    {focus}
                  </span>
                ) : null}
                {extras.blockers ? (
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {extras.blockers ? "Blockers set" : ""}
                  </span>
                ) : null}
                {extras.apps.length ? (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Apps: {extras.apps.join(", ")}
                  </span>
                ) : null}
                {extras.reason ? (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {extras.reason}
                  </span>
                ) : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-background/35 p-4">
                <div className="text-center font-mono text-5xl tracking-widest">
                  {state.phase === "idle"
                    ? formatClock(settings.focusMinutes * 60_000)
                    : formatClock(remainingMs)}
                </div>
                <div className="mt-3">
                  <Progress value={progress * 100} className="h-2" />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button
                  variant="outline"
                  onClick={async () => {
                    unlockAudio();
                    controls.skip();
                  }}
                  className="border-border/60 bg-background/40 backdrop-blur"
                  disabled={
                    isSettingUp ||
                    state.phase === "idle" ||
                    state.phase === "done"
                  }
                >
                  <SkipForward className="size-4" />
                  Skip
                </Button>
              </div>

              {playlist && !isSettingUp ? (
                <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50/90 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]">
                  <div className="text-[10px] tracking-[0.28em] text-emerald-100/70">
                    SPOTIFY
                  </div>
                  <div className="mt-1">
                    Pick playlist: <span className="font-mono">{playlist}</span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
