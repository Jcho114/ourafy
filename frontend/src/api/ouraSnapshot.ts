import axios from "axios";

import type { OuraSnapshotResponse } from "@/features/oura/types";

type OuraLocalDataResponse = {
  abr: number;
  cfc: number;
  day_summary: string;
  deep_sleep: number;
  efficiency: number;
  hrv_balance: number;
  latency: number;
  lir: number;
  nrm: number;
  recovery_index: number;
  rem_sleep: number;
  restfulness: number;
  resting_heart_rate: number;
  score: number;
  sleep_balance: number;
  stress_high: number;
  timing: number;
  total_sleep: number;
};

function asFiniteNumber(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function ratio01FromMaybePercent(v: unknown) {
  const n = asFiniteNumber(v);
  if (n == null) return null;
  if (n <= 1) return Math.max(0, Math.min(1, n));
  return Math.max(0, Math.min(1, n / 100));
}

function computeCfc(d: OuraLocalDataResponse) {
  const score = asFiniteNumber(d.score);
  const hrv = asFiniteNumber(d.hrv_balance);
  const sleep = asFiniteNumber(d.sleep_balance);
  const eff = asFiniteNumber(d.efficiency);
  const rec = asFiniteNumber(d.recovery_index);
  if (score == null || hrv == null || sleep == null || eff == null || rec == null) {
    return null;
  }
  // Composite Focus Capacity (F) using standard weights.
  return (
    0.3 * score +
    0.25 * hrv +
    0.2 * sleep +
    0.15 * eff +
    0.1 * rec
  ) / 100;
}

function computeSleepScore(d: OuraLocalDataResponse) {
  const deep = asFiniteNumber(d.deep_sleep);
  const rem = asFiniteNumber(d.rem_sleep);
  const eff = asFiniteNumber(d.efficiency);
  const restful = asFiniteNumber(d.restfulness);
  const timing = asFiniteNumber(d.timing);
  const total = asFiniteNumber(d.total_sleep);
  if (
    deep == null ||
    rem == null ||
    eff == null ||
    restful == null ||
    timing == null ||
    total == null
  ) {
    return null;
  }
  return Math.round((deep + rem + eff + restful + timing + total) / 6);
}

function mapLocalDataToSnapshot(data: OuraLocalDataResponse): OuraSnapshotResponse {
  const readinessScore = asFiniteNumber(data.score);
  const sleepScore = computeSleepScore(data) ?? undefined;
  const abr = ratio01FromMaybePercent(data.abr) ?? null;
  const cfc = ratio01FromMaybePercent(data.cfc) ?? computeCfc(data);
  const lir = ratio01FromMaybePercent(data.lir) ?? null;
  const nrm = ratio01FromMaybePercent(data.nrm) ?? null;

  return {
    readiness: {
      data: [
        {
          score: readinessScore ?? undefined,
          contributors: {
            hrv_balance: data.hrv_balance,
            recovery_index: data.recovery_index,
            resting_heart_rate: data.resting_heart_rate,
            sleep_balance: data.sleep_balance,
          },
        },
      ],
      next_token: null,
    },
    sleep: {
      data: [
        {
          score: sleepScore,
          contributors: {
            deep_sleep: data.deep_sleep,
            efficiency: data.efficiency,
            rem_sleep: data.rem_sleep,
            restfulness: data.restfulness,
            timing: data.timing,
            total_sleep: data.total_sleep,
          },
        },
      ],
      next_token: null,
    },
    stress: {
      data: [
        {
          day_summary: data.day_summary,
          stress_high: data.stress_high,
        },
      ],
      next_token: null,
    },
    resilience: {
      data: [
        {
          abr: abr ?? undefined,
          cfc: cfc ?? undefined,
          lir: lir ?? undefined,
          nrm: nrm ?? undefined,
        },
      ],
      next_token: null,
    },
  };
}

export async function getOuraSnapshot(): Promise<OuraSnapshotResponse> {
  try {
    const res = await axios.get<OuraLocalDataResponse>(
      "http://localhost:8000/oura/data",
    );
    return mapLocalDataToSnapshot(res.data);
  } catch {
    return {};
  }
}
