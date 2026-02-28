import * as React from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
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

import { StepRail } from "@/components/lockin/StepRail";

const MAX_FOCUS_CHARS = 150;

function readQueryFocus(search: string) {
  const sp = new URLSearchParams(search);
  const v = sp.get("focus");
  return (v ?? "").slice(0, MAX_FOCUS_CHARS);
}

export default function LockIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [focus, setFocus] = React.useState(() => readQueryFocus(location.search));
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  function next() {
    const trimmed = focus.trim();
    if (!trimmed) {
      toast.error("Type what you're locking in for.");
      inputRef.current?.focus();
      return;
    }

    const q = new URLSearchParams({ focus: trimmed.slice(0, MAX_FOCUS_CHARS) });
    navigate(`/snapshot?${q.toString()}`);
  }

  return (
    <div className="min-h-screen w-full cyber-bg">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pt-14 pb-14">
        <StepRail
          className="mb-6 -mx-2"
          currentKey="intake"
          steps={[
            { key: "intake", label: "Lock Target", sublabel: "What you're doing" },
            { key: "snapshot", label: "Bio + Setup", sublabel: "Readiness + inputs" },
            { key: "options", label: "Pick A Plan", sublabel: "Pomodoro choices" },
            { key: "timer", label: "Timer", sublabel: "Run it" },
          ]}
        />

        <div className="mb-6">
          <div className="text-xs tracking-[0.28em] text-muted-foreground">
            OURAFY / INTAKE
          </div>
          <div className="text-2xl font-semibold">What Are You Locking In For?</div>
          <div className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Keep it concrete. One line is enough.
          </div>
        </div>

        <Card className="border-border/60 bg-card/40 backdrop-blur">
          <CardHeader>
            <CardTitle className="tracking-wide">Lock Target</CardTitle>
            <CardDescription>
              {focus.length}/{MAX_FOCUS_CHARS}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="focus">Locking in for</Label>
              <Textarea
                ref={inputRef}
                id="focus"
                value={focus}
                onChange={(e) => setFocus(e.target.value.slice(0, MAX_FOCUS_CHARS))}
                placeholder="Ship the onboarding flow"
                wrap="soft"
                maxLength={MAX_FOCUS_CHARS}
                className="min-h-24 border-border/60 bg-background font-mono"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    next();
                  }
                }}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={next} className="px-6">
                Next
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
