import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getLockinOptions } from "@/api/lockinOptions";
import type { LockinOption } from "@/features/lockin/types";
import { unlockAudio } from "@/features/audio/beeps";
import { StepRail } from "@/components/lockin/StepRail";

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

function appsLabel(apps: string[]) {
  if (apps.length === 0) return "—";
  if (apps.length <= 3) return apps.join(" · ");
  return `${apps.slice(0, 3).join(" · ")} · +${apps.length - 3}`;
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
    queryKey: ["lockin-options", params],
    queryFn: () => getLockinOptions(params),
    enabled: Boolean(params.focus.trim()),
    staleTime: 60_000,
  });

  function choose(option: LockinOption) {
    unlockAudio();
    const q = new URLSearchParams({
      on: String(option.pomodoro.minutes_on),
      off: String(option.pomodoro.minutes_off),
      cycles: String(option.pomodoro.cycles),
      focus: params.focus,
      blockers: params.blockers,
      apps: option.apps_to_open.join(","),
      reason: option.reason,
    });
    navigate(`/pomodoro?${q.toString()}`);
  }

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
                  Contacting /api/lockin-options
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
                <CardDescription>Using fallback options.</CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {(query.data?.data ?? []).map((opt) => (
            <Card
              key={opt.id}
              className="border-border/60 bg-card/40 backdrop-blur"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span className="tracking-wide">{opt.id.toUpperCase()}</span>
                  <span className="rounded-md border border-border/60 bg-background/30 px-2 py-1 text-xs font-mono">
                    {opt.pomodoro.minutes_on}/{opt.pomodoro.minutes_off} x{" "}
                    {opt.pomodoro.cycles}
                  </span>
                </CardTitle>
                <CardDescription className="font-mono text-xs">
                  Apps: {appsLabel(opt.apps_to_open)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {opt.reason}
                </div>
                <Separator className="bg-border/60" />
                <div className="flex justify-end">
                  <Button onClick={() => choose(opt)} className="px-6">
                    Use This
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
