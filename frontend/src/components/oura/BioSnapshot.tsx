import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { OuraSnapshotResponse } from "@/features/oura/types";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function scoreTone(score: number) {
  if (score >= 80) return "text-cyan-300";
  if (score >= 60) return "text-amber-300";
  return "text-rose-300";
}

function minutesFromStressHigh(value: number) {
  // Oura stress_high is typically seconds.
  const minutes = Math.round(value / 60);
  return Math.max(0, minutes);
}

function formatMinutes(m: number) {
  if (m >= 120) return `${Math.round(m / 60)}h`;
  return `${m}m`;
}

function RingGauge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  const size = 56;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = clamp01(value / 100);
  const dash = c * p;

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${tone}`} aria-label={`${label} ${value}`}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="font-mono text-sm text-foreground">
            {Math.round(value)}
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs tracking-[0.22em] text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}

function ContributorBars({
  title,
  contributors,
}: {
  title: string;
  contributors: Record<string, number | null | undefined>;
}) {
  const items = Object.entries(contributors)
    .filter(([, v]) => typeof v === "number" && Number.isFinite(v))
    .map(([k, v]) => ({ key: k, value: v as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 bg-background/20 p-3 text-sm text-muted-foreground">
        {title}: no data
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-background/20 p-3">
      <div className="mb-3 text-xs tracking-[0.22em] text-muted-foreground">
        {title}
      </div>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.key} className="grid grid-cols-[1fr_3.2fr_2.5rem] items-center gap-3">
            <div className="truncate text-xs text-muted-foreground">
              {it.key.replaceAll("_", " ")}
            </div>
            <Progress value={it.value} className="h-1.5" />
            <div className="text-right font-mono text-xs text-muted-foreground">
              {Math.round(it.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BioSnapshot({ data }: { data: OuraSnapshotResponse }) {
  const [expanded] = React.useState(true);

  const readiness = data.readiness?.data?.[0];
  const sleep = data.sleep?.data?.[0];
  const stress = data.stress?.data?.[0];
  const day = readiness?.day || sleep?.day || stress?.day;

  const readinessScore = typeof readiness?.score === "number" ? readiness.score : null;
  const sleepScore = typeof sleep?.score === "number" ? sleep.score : null;

  const stressLabel = typeof stress?.day_summary === "string" ? stress.day_summary : null;
  const stressHigh = typeof stress?.stress_high === "number" ? stress.stress_high : null;
  const stressMinutes = stressHigh == null ? null : minutesFromStressHigh(stressHigh);

  return (
    <Card className="border-border/60 bg-card/40 backdrop-blur">
      <CardHeader>
        <CardTitle className="tracking-wide">Bio Snapshot</CardTitle>
        <CardDescription>
          {day ? `Today (${day})` : "Today"}
          {stressLabel ? ` · Stress: ${stressLabel}` : ""}
          {stressMinutes != null ? ` · High: ${formatMinutes(stressMinutes)}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {readinessScore != null ? (
            <RingGauge
              label="READINESS"
              value={readinessScore}
              tone={scoreTone(readinessScore)}
            />
          ) : (
            <div className="rounded-lg border border-border/60 bg-background/20 p-3 text-sm text-muted-foreground">
              Readiness: no data
            </div>
          )}

          {sleepScore != null ? (
            <RingGauge label="SLEEP" value={sleepScore} tone={scoreTone(sleepScore)} />
          ) : (
            <div className="rounded-lg border border-border/60 bg-background/20 p-3 text-sm text-muted-foreground">
              Sleep: no data
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-background/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs tracking-[0.22em] text-muted-foreground">STRESS</div>
              <div className="mt-1 text-sm">
                {stressLabel ? stressLabel.toUpperCase() : "NO DATA"}
              </div>
            </div>
            <div className="text-xs tracking-[0.22em] text-muted-foreground">
              DETAILS
            </div>
          </div>
          {stressMinutes != null ? (
            <div className="mt-3 grid grid-cols-[1fr_3.2fr_2.5rem] items-center gap-3">
              <div className="text-xs text-muted-foreground">High</div>
              <Progress value={clamp01(stressMinutes / 240) * 100} className="h-1.5" />
              <div className="text-right font-mono text-xs text-muted-foreground">
                {formatMinutes(stressMinutes)}
              </div>
            </div>
          ) : null}
        </div>

        {expanded ? (
          <div className="space-y-3">
            <ContributorBars title="Readiness Drivers" contributors={readiness?.contributors ?? {}} />
            <ContributorBars title="Sleep Drivers" contributors={sleep?.contributors ?? {}} />
            <div className="rounded-lg border border-border/60 bg-background/20 p-3 text-sm text-muted-foreground">
              Resilience: {data.resilience?.data?.length ? "available" : "no data"}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
