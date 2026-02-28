import * as React from "react";

export type PomodoroPhase = "idle" | "focus" | "shortBreak" | "done";

export type PomodoroSettings = {
  focusMinutes: number;
  shortBreakMinutes: number;
  rounds: number | null;
};

type Status = "stopped" | "running" | "paused";

type State = {
  phase: PomodoroPhase;
  status: Status;
  focusCompleted: number;
  startedAt: number | null;
  phaseStartedAt: number | null;
  phaseEndsAt: number | null;
  pausedRemainingMs: number | null;
};

function clampInt(n: number, min: number, max: number) {
  const x = Math.round(Number.isFinite(n) ? n : min);
  return Math.min(max, Math.max(min, x));
}

function phaseDurationMs(
  phase: Exclude<PomodoroPhase, "idle" | "done">,
  s: PomodoroSettings,
) {
  const minutes = phase === "focus" ? s.focusMinutes : s.shortBreakMinutes;
  return clampInt(minutes, 1, 240) * 60_000;
}

function nextPhase(current: PomodoroPhase) {
  if (current === "focus") return "shortBreak" as const;
  return "focus" as const;
}

type Action =
  | { type: "START"; now: number; settings: PomodoroSettings }
  | { type: "PAUSE"; now: number }
  | { type: "RESUME"; now: number }
  | { type: "TICK"; now: number; settings: PomodoroSettings }
  | { type: "SKIP"; now: number; settings: PomodoroSettings }
  | { type: "RESET" }
  | { type: "END" };

function initialState(): State {
  return {
    phase: "idle",
    status: "stopped",
    focusCompleted: 0,
    startedAt: null,
    phaseStartedAt: null,
    phaseEndsAt: null,
    pausedRemainingMs: null,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START": {
      const now = action.now;
      const phase: PomodoroPhase = "focus";
      const duration = phaseDurationMs("focus", action.settings);
      return {
        phase,
        status: "running",
        focusCompleted: 0,
        startedAt: now,
        phaseStartedAt: now,
        phaseEndsAt: now + duration,
        pausedRemainingMs: null,
      };
    }
    case "PAUSE": {
      if (state.status !== "running" || !state.phaseEndsAt) return state;
      const remaining = Math.max(0, state.phaseEndsAt - action.now);
      return {
        ...state,
        status: "paused",
        pausedRemainingMs: remaining,
        phaseEndsAt: null,
      };
    }
    case "RESUME": {
      if (state.status !== "paused" || state.pausedRemainingMs == null)
        return state;
      const now = action.now;
      return {
        ...state,
        status: "running",
        phaseStartedAt: now,
        phaseEndsAt: now + state.pausedRemainingMs,
        pausedRemainingMs: null,
      };
    }
    case "SKIP": {
      if (state.phase === "idle" || state.phase === "done") return state;
      const now = action.now;
      const focusCompletedNext =
        state.phase === "focus"
          ? state.focusCompleted + 1
          : state.focusCompleted;
      const rounds = action.settings.rounds;
      if (
        rounds != null &&
        focusCompletedNext >= rounds &&
        state.phase === "focus"
      ) {
        return {
          ...state,
          phase: "done",
          status: "stopped",
          phaseEndsAt: null,
          pausedRemainingMs: null,
        };
      }
      const next = nextPhase(state.phase);
      const duration = phaseDurationMs(next, action.settings);
      return {
        ...state,
        phase: next,
        status: "running",
        focusCompleted: focusCompletedNext,
        phaseStartedAt: now,
        phaseEndsAt: now + duration,
        pausedRemainingMs: null,
      };
    }
    case "TICK": {
      if (state.status !== "running" || !state.phaseEndsAt) return state;
      if (action.now < state.phaseEndsAt) return state;
      if (state.phase === "idle" || state.phase === "done") return state;

      const now = action.now;
      const focusCompletedNext =
        state.phase === "focus"
          ? state.focusCompleted + 1
          : state.focusCompleted;
      const rounds = action.settings.rounds;
      if (
        rounds != null &&
        focusCompletedNext >= rounds &&
        state.phase === "focus"
      ) {
        return {
          ...state,
          phase: "done",
          status: "stopped",
          phaseEndsAt: null,
          pausedRemainingMs: null,
        };
      }

      const next = nextPhase(state.phase);
      const duration = phaseDurationMs(next, action.settings);
      return {
        ...state,
        phase: next,
        status: "running",
        focusCompleted: focusCompletedNext,
        phaseStartedAt: now,
        phaseEndsAt: now + duration,
        pausedRemainingMs: null,
      };
    }
    case "RESET":
      return initialState();
    case "END":
      return { ...initialState(), phase: "done" };
    default:
      return state;
  }
}

export function usePomodoroMachine(settings: PomodoroSettings) {
  const [state, dispatch] = React.useReducer(reducer, undefined, initialState);
  const settingsRef = React.useRef(settings);
  React.useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (state.status !== "running") return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [state.status]);

  React.useEffect(() => {
    if (state.status !== "running") return;
    dispatch({ type: "TICK", now: Date.now(), settings: settingsRef.current });
  }, [now, state.status]);

  const remainingMs = React.useMemo(() => {
    if (state.status === "paused" && state.pausedRemainingMs != null)
      return state.pausedRemainingMs;
    if (state.status !== "running" || !state.phaseEndsAt) return 0;
    return Math.max(0, state.phaseEndsAt - now);
  }, [now, state.phaseEndsAt, state.pausedRemainingMs, state.status]);

  const phaseTotalMs = React.useMemo(() => {
    if (state.phase === "focus" || state.phase === "shortBreak") {
      return phaseDurationMs(state.phase, settings);
    }
    return 0;
  }, [settings, state.phase]);

  const progress = React.useMemo(() => {
    if (!phaseTotalMs) return 0;
    return Math.min(1, Math.max(0, 1 - remainingMs / phaseTotalMs));
  }, [phaseTotalMs, remainingMs]);

  const controls = React.useMemo(
    () => ({
      start: () =>
        dispatch({
          type: "START",
          now: Date.now(),
          settings: settingsRef.current,
        }),
      pause: () => dispatch({ type: "PAUSE", now: Date.now() }),
      resume: () => dispatch({ type: "RESUME", now: Date.now() }),
      skip: () =>
        dispatch({
          type: "SKIP",
          now: Date.now(),
          settings: settingsRef.current,
        }),
      reset: () => dispatch({ type: "RESET" }),
      end: () => dispatch({ type: "END" }),
    }),
    [],
  );

  return { state, remainingMs, progress, controls };
}
