import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { unlockAudio } from "@/features/audio/beeps";
import { StepRail } from "@/components/lockin/StepRail";

type OptionSong = {
  artist: string;
  name: string;
};

type PomodoroOption = {
  cycles: number;
  minutes_off: number;
  minutes_on: number;
  playlist_title: string;
  songs: OptionSong[];
  suitability_score?: string | number;
};

type OptionsResponse = {
  apps_to_open: string[];
  pomodoro: {
    lockin: PomodoroOption;
    recover: PomodoroOption;
    sprint: PomodoroOption;
    standard: PomodoroOption;
  };
  reason: string;
  recommended_mode: string;
};

type ModeKey = "LOCKIN" | "RECOVER" | "SPRINT" | "STANDARD";

type PlanMode = {
  key: ModeKey;
  title: string;
  data: PomodoroOption;
};

type OpenResponse = {
  url: string;
};

type OpenRequestBody = {
  playlist_title: string;
  songs: Array<{ artist: string; track: string }>;
  apps_to_open: string[];
};

function readParams(search: string) {
  const sp = new URLSearchParams(search);
  const focus = (sp.get("focus") ?? "").slice(0, 150);
  const blockers = (sp.get("blockers") ?? "").slice(0, 120);
  const task_type = (sp.get("task_type") ?? "").slice(0, 24);
  const priority = (sp.get("priority") ?? "").slice(0, 16);
  const time_available_min = Number(sp.get("time_available_min") ?? "");
  const hard_stop = (sp.get("hard_stop") ?? "").slice(0, 16);
  return {
    focus,
    blockers,
    task_type,
    priority,
    time_available_min: Number.isFinite(time_available_min)
      ? time_available_min
      : undefined,
    hard_stop,
  };
}

function scoreLabel(score: PomodoroOption["suitability_score"]) {
  const n = typeof score === "string" ? Number.parseFloat(score) : score;
  if (!Number.isFinite(n as number)) return "—";
  return `${Math.round((n as number) * 100)}%`;
}

function modeTitle(key: ModeKey) {
  if (key === "LOCKIN") return "Lock-In";
  if (key === "RECOVER") return "Recover";
  if (key === "SPRINT") return "Sprint";
  return "Standard";
}

export default function Plan() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = React.useMemo(
    () => readParams(location.search),
    [location.search],
  );

  React.useEffect(() => {
    if (!params.focus.trim()) {
      toast.message("Add your lock target first.");
      navigate("/lock-in");
    }
  }, [navigate, params.focus]);

  const query = useQuery({
    queryKey: ["options"],
    queryFn: async () => {
      const res = await axios.post<OptionsResponse>(
        "http://localhost:8000/options",
        {},
      );
      return res.data;
    },
    enabled: Boolean(params.focus.trim()),
    staleTime: 60_000,
  });

  const openPlaylist = useMutation({
    mutationKey: ["open-playlist"],
    mutationFn: async (body: OpenRequestBody) => {
      const res = await axios.post<OpenResponse>(
        "http://localhost:8000/open",
        body,
      );
      return res.data;
    },
  });

  function choose(mode: PlanMode, payload: OptionsResponse) {
    unlockAudio();

    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;

    const openBody: OpenRequestBody = {
      playlist_title: mode.data.playlist_title,
      songs: (mode.data.songs ?? []).map((s) => ({
        artist: s.artist,
        track: s.name,
      })),
      apps_to_open: payload.apps_to_open ?? [],
    };

    void openPlaylist
      .mutateAsync(openBody)
      .then((payload) => {
        const url = payload?.url;
        if (!url || typeof url !== "string") {
          if (tab && !tab.closed) tab.close();
          toast.error("Couldn't open Spotify playlist.");
          return;
        }

        if (tab && !tab.closed) {
          tab.location.assign(url);
          return;
        }

        const w = window.open(url, "_blank");
        if (w) w.opener = null;
      })
      .catch((err) => {
        console.error(err);
        if (tab && !tab.closed) tab.close();
        toast.error("Couldn't open Spotify playlist.");
      });

    const baseReason = (payload.reason ?? "").slice(0, 400);
    const reason =
      payload.recommended_mode?.toUpperCase?.() === mode.key
        ? baseReason
        : `Selected ${modeTitle(mode.key)}. Recommended: ${payload.recommended_mode}. ${baseReason}`.slice(
            0,
            400,
          );

    const q = new URLSearchParams({
      on: String(mode.data.minutes_on),
      off: String(mode.data.minutes_off),
      cycles: String(mode.data.cycles),
      focus: params.focus,
      blockers: params.blockers,
      apps: (payload.apps_to_open ?? []).join(","),
      reason,
    });
    navigate(`/pomodoro?${q.toString()}`);
  }

  const modes = React.useMemo<PlanMode[]>(() => {
    const data = query.data;
    if (!data) return [];
    return [
      {
        key: "STANDARD",
        title: modeTitle("STANDARD"),
        data: data.pomodoro.standard,
      },
      { key: "LOCKIN", title: modeTitle("LOCKIN"), data: data.pomodoro.lockin },
      { key: "SPRINT", title: modeTitle("SPRINT"), data: data.pomodoro.sprint },
      {
        key: "RECOVER",
        title: modeTitle("RECOVER"),
        data: data.pomodoro.recover,
      },
    ];
  }, [query.data]);

  const recommendedKey = React.useMemo<ModeKey | null>(() => {
    const raw = query.data?.recommended_mode;
    const k = (raw ?? "").toUpperCase();
    if (
      k === "STANDARD" ||
      k === "LOCKIN" ||
      k === "SPRINT" ||
      k === "RECOVER"
    ) {
      return k;
    }
    return null;
  }, [query.data?.recommended_mode]);

  return (
    <div className="min-h-screen w-full cyber-bg">
      <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-14">
        <StepRail
          className="mb-6 -mx-2"
          currentKey="options"
          steps={[
            {
              key: "intake",
              label: "Lock Target",
              sublabel: "What you're doing",
            },
            {
              key: "snapshot",
              label: "Bio + Setup",
              sublabel: "Readiness + inputs",
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
              OURAFY / OPTIONS
            </div>
            <div className="text-2xl font-semibold">Pick A Session</div>
            <div className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Based on your snapshot + intake, here are a few plans.
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() =>
              navigate(`/snapshot?focus=${encodeURIComponent(params.focus)}`)
            }
            className="border-border/60 bg-background/40 backdrop-blur"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {query.isLoading ? (
            <Card className="border-border/60 bg-card/40 backdrop-blur">
              <CardHeader>
                <CardTitle className="tracking-wide">
                  Loading options…
                </CardTitle>
                <CardDescription>
                  Contacting http://localhost:8000/options
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {query.isError ? (
            <Card className="border-border/60 bg-card/40 backdrop-blur">
              <CardHeader>
                <CardTitle className="tracking-wide">
                  Couldn’t load options
                </CardTitle>
                <CardDescription>
                  Make sure the Flask server is running on localhost:8000.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {modes.map((m) => {
            const payload = query.data;
            if (!payload) return null;
            const isRecommended = recommendedKey === m.key;
            const songs = m.data.songs ?? [];
            const visibleSongs = songs.slice(0, 5);
            return (
              <Card
                key={m.key}
                className="border-border/60 bg-card/40 backdrop-blur"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3">
                    <span className="tracking-wide">
                      {m.title}
                      {isRecommended ? (
                        <span className="ml-2 rounded-md border border-border/60 bg-background/30 px-2 py-1 text-[10px] font-mono align-middle">
                          RECOMMENDED
                        </span>
                      ) : null}
                    </span>
                    <span className="rounded-md border border-border/60 bg-background/30 px-2 py-1 text-xs font-mono">
                      {m.data.minutes_on}/{m.data.minutes_off} x {m.data.cycles}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    <span className="font-mono">{m.data.playlist_title}</span>
                    <span className="ml-2 font-mono">
                      Score: {scoreLabel(m.data.suitability_score)}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {visibleSongs.length ? (
                    <div className="rounded-xl border border-border/60 bg-background/35 p-4">
                      <div className="text-xs tracking-[0.28em] text-muted-foreground">
                        TOP TRACKS
                      </div>
                      <div className="mt-2 space-y-1 text-sm">
                        {visibleSongs.map((s, idx) => (
                          <div
                            key={`${s.artist}-${s.name}-${idx}`}
                            className="flex items-baseline justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1 truncate">
                              {s.name}
                            </div>
                            <div className="shrink-0 font-mono text-xs text-muted-foreground">
                              {s.artist}
                            </div>
                          </div>
                        ))}
                        {songs.length > visibleSongs.length ? (
                          <div className="pt-1 text-xs text-muted-foreground">
                            +{songs.length - visibleSongs.length} more
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex justify-end">
                    <Button onClick={() => choose(m, payload)} className="px-6">
                      Use This
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
