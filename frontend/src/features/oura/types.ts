export type ReadinessEntry = {
  day?: string;
  score?: number;
  temperature_deviation?: number;
  temperature_trend_deviation?: number;
  contributors?: Record<string, number | null | undefined>;
};

export type SleepEntry = {
  day?: string;
  score?: number;
  contributors?: Record<string, number | null | undefined>;
};

export type StressEntry = {
  day?: string;
  day_summary?: string;
  stress_high?: number;
};

export type ResilienceEntry = {
  abr?: number;
  cfc?: number;
  lir?: number;
  nrm?: number;
};

export type OuraSnapshotResponse = {
  readiness?: { data?: ReadonlyArray<ReadinessEntry>; next_token?: string | null };
  resilience?: { data?: ReadonlyArray<ResilienceEntry>; next_token?: string | null };
  sleep?: { data?: ReadonlyArray<SleepEntry>; next_token?: string | null };
  stress?: { data?: ReadonlyArray<StressEntry>; next_token?: string | null };
};
