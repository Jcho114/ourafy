import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { OuraSnapshotResponse, ResilienceEntry } from "@/features/oura/types";

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

function formatRatio01AsPct(v: number) {
  if (!Number.isFinite(v)) return "—";
  return `${Math.round(v * 100)}%`;
}

function formatRatio(v: number) {
  if (!Number.isFinite(v)) return "—";
  return v.toFixed(2);
}

function ModelChip({
  label,
  value,
  tooltip,
  format = "pct",
}: {
  label: string;
  value: number | null;
  tooltip: React.ReactNode;
  format?: "pct" | "ratio";
}) {
  const display =
    value == null
      ? "—"
      : format === "ratio"
        ? formatRatio(value)
        : formatRatio01AsPct(value);

  return (
    <div className="rounded-lg border border-border/60 bg-background/20 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-left text-[11px] tracking-[0.22em] text-muted-foreground outline-none"
              aria-label={`${label} details`}
            >
              {label}
            </button>
          </TooltipTrigger>
          <TooltipContent sideOffset={8} className="max-w-sm">
            {tooltip}
          </TooltipContent>
        </Tooltip>
        <div className="font-mono text-sm text-foreground">{display}</div>
      </div>
    </div>
  );
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

export function BioSnapshot({ data }: { data: OuraSnapshotResponse }) {
  const readiness = data.readiness?.data?.[0];
  const sleep = data.sleep?.data?.[0];
  const stress = data.stress?.data?.[0];
  const model = (data.resilience?.data?.[0] ?? {}) as ResilienceEntry;
  const day = readiness?.day || sleep?.day || stress?.day;

  const readinessScore = typeof readiness?.score === "number" ? readiness.score : null;
  const sleepScore = typeof sleep?.score === "number" ? sleep.score : null;

  const stressLabel = typeof stress?.day_summary === "string" ? stress.day_summary : null;
  const stressHigh = typeof stress?.stress_high === "number" ? stress.stress_high : null;
  const stressMinutes = stressHigh == null ? null : minutesFromStressHigh(stressHigh);

  const cfc = typeof model.cfc === "number" ? model.cfc : null;
  const nrm = typeof model.nrm === "number" ? model.nrm : null;
  const abr = typeof model.abr === "number" ? model.abr : null;
  const lir = typeof model.lir === "number" ? model.lir : null;

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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ModelChip
            label="FOCUS CAPACITY"
            value={cfc}
            tooltip={
              <div className="space-y-1">
                <div className="font-mono">
                  F = (0.30*score + 0.25*hrv_balance + 0.20*sleep_balance + 0.15*efficiency + 0.10*recovery_index) / 100
                </div>
                <div>Composite focus capacity (0..1), shown as percent.</div>
              </div>
            }
          />
          <ModelChip
            label="NEURO READINESS"
            value={nrm}
            tooltip={
              <div className="space-y-1">
                <div className="font-mono">
                  NR = theta1(hrv_balance) + theta2(deep_sleep) + theta3(rem_sleep) - theta4(stress_high)
                </div>
                <div>Neurocognitive clarity proxy (0..1).</div>
              </div>
            }
          />
          <ModelChip
            label="AUTONOMIC RATIO"
            value={abr}
            format="ratio"
            tooltip={
              <div className="space-y-1">
                <div className="font-mono">ABR = hrv_balance / resting_heart_rate</div>
                <div>Higher usually indicates stronger parasympathetic balance.</div>
              </div>
            }
          />
          <ModelChip
            label="LOCK-IN READINESS"
            value={lir}
            tooltip={
              <div className="space-y-1">
                <div className="font-mono">LI = (score + hrv_balance + sleep_balance + deep_sleep)/4 - k(stress_high)</div>
                <div>Activation metric used to trigger deep-work mode (0..1).</div>
              </div>
            }
          />
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
      </CardContent>
    </Card>
  );
}

export function BioSnapshotSkeleton() {
  return (
    <Card className="border-border/60 bg-card/40 backdrop-blur">
      <CardHeader>
        <CardTitle className="tracking-wide">
          <Skeleton className="h-5 w-36" />
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-28" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>

        <div className="rounded-lg border border-border/60 bg-background/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="mt-3 grid grid-cols-[1fr_3.2fr_2.5rem] items-center gap-3">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-3 w-10 justify-self-end" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
