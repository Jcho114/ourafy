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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { BioSnapshot } from "@/components/oura/BioSnapshot";
import { getOuraSnapshot } from "@/api/ouraSnapshot";
import { StepRail } from "@/components/lockin/StepRail";

const MAX_FOCUS_CHARS = 150;
const MAX_BLOCKERS_CHARS = 120;

function readQueryFocus(search: string) {
  const sp = new URLSearchParams(search);
  const v = sp.get("focus");
  return (v ?? "").slice(0, MAX_FOCUS_CHARS);
}

export default function Snapshot() {
  const location = useLocation();
  const navigate = useNavigate();

  const focus = React.useMemo(
    () => readQueryFocus(location.search),
    [location.search],
  );
  const [taskType, setTaskType] = React.useState<string>("build");
  const [priority, setPriority] = React.useState<string>("medium");
  const [timeAvailableMin, setTimeAvailableMin] = React.useState<number>(60);
  const [hardStop, setHardStop] = React.useState<string>("");
  const [blockers, setBlockers] = React.useState("");

  const snapshot = useQuery({
    queryKey: ["oura-snapshot"],
    queryFn: () => getOuraSnapshot(),
    staleTime: 60_000,
  });

  React.useEffect(() => {
    if (!focus.trim()) {
      toast.message("Add your lock target first.");
      navigate("/lock-in");
    }
  }, [focus, navigate]);

  function startSession() {
    if (!focus.trim()) {
      toast.error("Missing lock target.");
      navigate("/lock-in");
      return;
    }

    const q = new URLSearchParams({
      focus: focus.trim().slice(0, MAX_FOCUS_CHARS),
      task_type: taskType,
      priority,
      time_available_min: String(Math.round(timeAvailableMin)),
      hard_stop: hardStop,
      blockers: blockers.trim().slice(0, MAX_BLOCKERS_CHARS),
    });

    navigate(`/plan?${q.toString()}`);
  }

  return (
    <div className="min-h-screen w-full cyber-bg">
      <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-14">
        <StepRail
          className="mb-6 -mx-2"
          currentKey="snapshot"
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
              OURAFY / SNAPSHOT
            </div>
            <div className="text-2xl font-semibold">Bio + Setup</div>
            <div className="mt-2 max-w-2xl text-sm text-muted-foreground">
              We use your snapshot + a few details to shape the session.
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() =>
              navigate(`/lock-in?focus=${encodeURIComponent(focus)}`)
            }
            className="border-border/60 bg-background/40 backdrop-blur"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_0.95fr]">
          {snapshot.data ? (
            <BioSnapshot data={snapshot.data} />
          ) : (
            <BioSnapshot data={{}} />
          )}

          <Card className="border-border/60 bg-card/40 backdrop-blur">
            <CardHeader>
              <CardTitle className="tracking-wide">
                Tailor This Session
              </CardTitle>
              <CardDescription>
                Lock target: <span className="font-mono">{focus || "—"}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Task type</Label>
                  <Select value={taskType} onValueChange={setTaskType}>
                    <SelectTrigger className="border-border/60 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="build">Build</SelectItem>
                      <SelectItem value="write">Writing</SelectItem>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="border-border/60 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Time available</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Slider
                      value={[timeAvailableMin]}
                      min={15}
                      max={180}
                      step={5}
                      onValueChange={(v) => setTimeAvailableMin(v[0])}
                    />
                  </div>
                  <div className="w-16 text-right font-mono text-sm text-muted-foreground">
                    {timeAvailableMin}m
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Used to recommend cycles and break length.
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blockers">
                  Distractions to block (optional)
                </Label>
                <Textarea
                  id="blockers"
                  value={blockers}
                  onChange={(e) =>
                    setBlockers(e.target.value.slice(0, MAX_BLOCKERS_CHARS))
                  }
                  placeholder="Slack, email, YouTube"
                  wrap="soft"
                  maxLength={MAX_BLOCKERS_CHARS}
                  className="min-h-16 border-border/60 bg-background"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                  Next: pick a suggested pomodoro plan
                </div>
                <Button onClick={startSession} className="px-6">
                  See Options
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
