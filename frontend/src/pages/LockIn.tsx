import * as React from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StepRail } from "@/components/lockin/StepRail";
import { getOuraSnapshot } from "@/api/ouraSnapshot";
import { playCoachTryIt, unlockAudio } from "@/features/audio/beeps";
import { cn } from "@/lib/utils";

const DEFAULT_COACH_ID = "jasonchen";

const ON_URLS = import.meta.glob("../assets/*/on.mp3", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const OFF_URLS = import.meta.glob("../assets/*/off.mp3", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const HEADSHOT_URLS = import.meta.glob(
  "../assets/*/headshot.{png,jpg,jpeg,webp,avif,svg}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
) as Record<string, string>;

const TRYIT_URLS = import.meta.glob("../assets/*/tryit.mp3", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function readQueryFocus(search: string) {
  const sp = new URLSearchParams(search);
  const v = sp.get("focus");
  return (v ?? "").slice(0, 150);
}

function readQueryCoach(search: string) {
  const sp = new URLSearchParams(search);
  const raw = (sp.get("coach") ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (!/^[a-z0-9_-]{1,48}$/.test(raw)) return "";
  return raw;
}

function readStoredCoach() {
  try {
    const raw = (window.localStorage.getItem("ourafy.coach") ?? "")
      .trim()
      .toLowerCase();
    if (!raw) return "";
    if (!/^[a-z0-9_-]{1,48}$/.test(raw)) return "";
    return raw;
  } catch {
    return "";
  }
}

function coachDisplayName(id: string) {
  if (id === "jasonchen") return "Jason Chen";
  if (id === "heisenberg") return "Heisenberg";
  return id.replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function coachSubtitle(id: string) {
  if (id === "jasonchen") return "Calm, practical, steady momentum";
  if (id === "peter") return "Analytical, systems-first, ruthless clarity";
  if (id === "lauren") return "Warm, encouraging, confidence builder";
  if (id === "charles") return "Clear, structured, fast start";
  if (id === "heisenberg") return "High intensity, no excuses";
  return "Lifestyle coach";
}

function coachIdsFromGlobKeys(keys: string[]) {
  const out = new Set<string>();
  for (const p of keys) {
    const parts = p.split("?")[0].split("/");
    const coach = parts[parts.length - 2] ?? "";
    if (coach) out.add(coach);
  }
  return out;
}

function coachAssetsFromGlob(urls: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const [p, url] of Object.entries(urls)) {
    const parts = p.split("?")[0].split("/");
    const coach = parts[parts.length - 2] ?? "";
    if (!coach) continue;
    out[coach] = url;
  }
  return out;
}

function coachInitials(id: string) {
  if (id === "jasonchen") return "JC";
  if (id === "heisenberg") return "H";
  const cleaned = id.replace(/[_-]+/g, " ").trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

export default function LockIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const focus = React.useMemo(
    () => readQueryFocus(location.search),
    [location.search],
  );

  React.useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: ["oura-snapshot"],
      queryFn: () => getOuraSnapshot(),
      staleTime: 60_000,
    });
  }, [queryClient]);

  const coachIds = React.useMemo(() => {
    const on = coachIdsFromGlobKeys(Object.keys(ON_URLS));
    const off = coachIdsFromGlobKeys(Object.keys(OFF_URLS));
    const both: string[] = [];
    for (const id of on) {
      if (off.has(id)) both.push(id);
    }
    both.sort();
    return both;
  }, []);

  const headshots = React.useMemo(() => coachAssetsFromGlob(HEADSHOT_URLS), []);

  const tryits = React.useMemo(() => coachAssetsFromGlob(TRYIT_URLS), []);

  const coachFromQuery = React.useMemo(
    () => readQueryCoach(location.search),
    [location.search],
  );

  const activeCoach = React.useMemo(() => {
    const stored = typeof window === "undefined" ? "" : readStoredCoach();
    const picked = coachFromQuery || stored;
    if (picked && coachIds.includes(picked)) return picked;
    if (coachIds.includes(DEFAULT_COACH_ID)) return DEFAULT_COACH_ID;
    return coachIds[0] ?? DEFAULT_COACH_ID;
  }, [coachFromQuery, coachIds]);

  function pickCoach(coachId: string) {
    try {
      window.localStorage.setItem("ourafy.coach", coachId);
    } catch {
      // ignore
    }

    unlockAudio();

    const q = new URLSearchParams({
      ...(focus ? { focus } : {}),
      coach: coachId,
    });
    navigate(`/snapshot?${q.toString()}`);
  }

  return (
    <div className="min-h-screen w-full cyber-bg">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pt-14 pb-14">
        <StepRail
          className="mb-6 -mx-2"
          currentKey="intake"
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

        <div className="mb-6">
          <div className="text-xs tracking-[0.28em] text-muted-foreground">
            OURAFY / INTAKE
          </div>
          <div className="text-2xl font-semibold">Pick Your Coach</div>
          <div className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your coach sets the vibe for the session cues.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {coachIds.map((id) => {
            const selected = id === activeCoach;
            const headshot = headshots[id];
            const canTry = Boolean(tryits[id]);
            return (
              <Card
                key={id}
                className={cn(
                  "border-border/60 bg-card/40 backdrop-blur transition-colors",
                  selected
                    ? "ring-2 ring-primary/50 border-primary/50"
                    : "hover:border-border",
                )}
                role="button"
                tabIndex={0}
                onClick={() => pickCoach(id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    pickCoach(id);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-14 overflow-hidden rounded-xl border border-border/60 bg-background/30 shrink-0">
                        {headshot ? (
                          <img
                            src={headshot}
                            alt={coachDisplayName(id)}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold tracking-wide text-muted-foreground">
                            {coachInitials(id)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <CardTitle className="tracking-wide truncate">
                          {coachDisplayName(id)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {coachSubtitle(id)}
                        </CardDescription>
                      </div>
                    </div>

                    {id === DEFAULT_COACH_ID ? (
                      <span className="rounded-md border border-border/60 bg-background/30 px-2 py-1 text-xs tracking-[0.2em] shrink-0">
                        DEFAULT
                      </span>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Cues: on / off
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="px-4"
                      disabled={!canTry}
                      onClick={(e) => {
                        e.stopPropagation();
                        void playCoachTryIt(id);
                      }}
                    >
                      Try
                    </Button>
                    <Button
                      variant={selected ? "default" : "outline"}
                      className="px-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        pickCoach(id);
                      }}
                    >
                      Choose
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
