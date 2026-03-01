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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BioSnapshot, BioSnapshotSkeleton } from "@/components/oura/BioSnapshot";
import { getOuraSnapshot } from "@/api/ouraSnapshot";
import { StepRail } from "@/components/lockin/StepRail";

const MAX_FOCUS_CHARS = 150;
const DEFAULT_COACH_ID = "jasonchen";

function readQueryFocus(search: string) {
  const sp = new URLSearchParams(search);
  const v = sp.get("focus");
  return (v ?? "").slice(0, MAX_FOCUS_CHARS);
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
  return id
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function Snapshot() {
  const location = useLocation();
  const navigate = useNavigate();

  const initialFocus = React.useMemo(
    () => readQueryFocus(location.search),
    [location.search],
  );
  const [focus, setFocus] = React.useState(() => initialFocus);
  const focusRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    setFocus(initialFocus);
  }, [initialFocus]);

  const coach = React.useMemo(() => {
    const fromQuery = readQueryCoach(location.search);
    const fromStorage = typeof window === "undefined" ? "" : readStoredCoach();
    return fromQuery || fromStorage || DEFAULT_COACH_ID;
  }, [location.search]);

  React.useEffect(() => {
    if (!coach) return;
    try {
      window.localStorage.setItem("ourafy.coach", coach);
    } catch {
      // ignore
    }
  }, [coach]);

  const [taskType, setTaskType] = React.useState<string>("build");
  const [priority, setPriority] = React.useState<string>("medium");
  const [hardStop] = React.useState<string>("");

  const snapshot = useQuery({
    queryKey: ["oura-snapshot"],
    queryFn: () => getOuraSnapshot(),
    staleTime: 60_000,
  });

  function startSession() {
    if (!focus.trim()) {
      toast.error("Missing lock target.");
      focusRef.current?.focus();
      return;
    }

    const q = new URLSearchParams({
      focus: focus.trim().slice(0, MAX_FOCUS_CHARS),
      task_type: taskType,
      priority,
      hard_stop: hardStop,
      blockers: "",
      ...(coach ? { coach } : {}),
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
              navigate(
                `/lock-in?${new URLSearchParams({
                  ...(focus ? { focus } : {}),
                  ...(coach ? { coach } : {}),
                }).toString()}`,
              )
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
          ) : snapshot.isLoading ? (
            <BioSnapshotSkeleton />
          ) : (
            <BioSnapshot data={{}} />
          )}

          <Card className="border-border/60 bg-card/40 backdrop-blur">
            <CardHeader>
              <CardTitle className="tracking-wide">
                Lock Target + Setup
              </CardTitle>
              <CardDescription>
                Coach: <span className="font-mono">{coachDisplayName(coach)}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="focus">What are you locking in for?</Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {focus.length}/{MAX_FOCUS_CHARS}
                  </span>
                </div>
                <Textarea
                  ref={focusRef}
                  id="focus"
                  value={focus}
                  onChange={(e) =>
                    setFocus(e.target.value.slice(0, MAX_FOCUS_CHARS))
                  }
                  placeholder="Ship the onboarding flow"
                  wrap="soft"
                  maxLength={MAX_FOCUS_CHARS}
                  className="min-h-24 border-border/60 bg-background font-mono"
                />
                <div className="text-xs text-muted-foreground">
                  Keep it concrete. One line is enough.
                </div>
              </div>

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
