import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

function lockinMockApi() {
  return {
    name: "lockin-mock-api",
    configureServer(server: unknown) {
      const s = server as { middlewares: { use: (path: string, h: (req: unknown, res: unknown) => void) => void } }

      s.middlewares.use("/api/lockin-options", (req: unknown, res: unknown) => {
        const r = req as { originalUrl?: string; url?: string }
        const w = res as { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void }

        const url = new URL(r.originalUrl || r.url || "", "http://localhost");
        const focus = (url.searchParams.get("focus") ?? "").slice(0, 150);
        const blockers = (url.searchParams.get("blockers") ?? "").slice(0, 120);
        const taskType = (url.searchParams.get("task_type") ?? "").slice(0, 24);
        const priority = (url.searchParams.get("priority") ?? "").slice(0, 16);
        const timeAvail = Number(url.searchParams.get("time_available_min") ?? "");

        const baseReasonTail = [
          focus ? `Focus: ${focus}.` : "",
          blockers ? "Blockers set." : "",
          taskType ? `Type: ${taskType}.` : "",
          priority ? `Priority: ${priority}.` : "",
          Number.isFinite(timeAvail) ? `Time: ${Math.round(timeAvail)}m.` : "",
        ]
          .filter(Boolean)
          .join(" ");

        const options = [
          {
            id: "recover",
            apps_to_open: blockers ? ["VSCode", "Notion"] : ["VSCode", "Notion", "Calendar"],
            pomodoro: { minutes_on: 20, minutes_off: 10, cycles: 3 },
            reason:
              "Shorter focus blocks and longer breaks to keep energy steady. Fewer apps to reduce context switching.",
          },
          {
            id: "standard",
            apps_to_open: blockers ? ["VSCode", "Notion"] : ["VSCode", "Notion", "Slack"],
            pomodoro: { minutes_on: 25, minutes_off: 5, cycles: 4 },
            reason:
              "Classic cadence for consistent progress with minimal setup. Balanced work/break rhythm.",
          },
          {
            id: "sprint",
            apps_to_open: blockers ? ["VSCode"] : ["VSCode", "Notion"],
            pomodoro: { minutes_on: 35, minutes_off: 5, cycles: 3 },
            reason:
              "Longer focus blocks to push through a chunk of work. Best when you already know the next steps.",
          },
        ].map((o) => ({
          ...o,
          reason:
            baseReasonTail ? `${o.reason} ${baseReasonTail}` : o.reason,
        }));

        w.statusCode = 200;
        w.setHeader("Content-Type", "application/json");
        w.end(JSON.stringify({ data: options }));
      });

      s.middlewares.use("/api/oura-snapshot", (_req: unknown, res: unknown) => {
        const w = res as { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void }

        const body = {
          readiness: {
            data: [
              {
                id: "f66a75f6-fab6-47c3-b91d-248a2a50daf7",
                contributors: {
                  activity_balance: 68,
                  body_temperature: 92,
                  hrv_balance: 91,
                  previous_day_activity: null,
                  previous_night: 69,
                  recovery_index: 23,
                  resting_heart_rate: 100,
                  sleep_balance: 73,
                  sleep_regularity: 90,
                },
                day: "2026-02-28",
                score: 76,
                temperature_deviation: -0.38,
                temperature_trend_deviation: -0.18,
                timestamp: "2026-02-28T00:00:00.000+00:00",
              },
            ],
            next_token: null,
          },
          resilience: { data: [], next_token: null },
          sleep: {
            data: [
              {
                id: "40e9cf07-9402-4318-a19b-d90523af5e1e",
                contributors: {
                  deep_sleep: 95,
                  efficiency: 90,
                  latency: 67,
                  rem_sleep: 47,
                  restfulness: 86,
                  timing: 100,
                  total_sleep: 59,
                },
                day: "2026-02-28",
                score: 74,
                timestamp: "2026-02-28T00:00:00.000+00:00",
              },
            ],
            next_token: null,
          },
          stress: {
            data: [
              {
                id: "c9491d00-06da-4a08-9ce7-51474545e8f4",
                day: "2026-02-28",
                day_summary: "stressful",
                recovery_high: 0,
                stress_high: 12600,
              },
            ],
            next_token: null,
          },
        };

        w.statusCode = 200;
        w.setHeader("Content-Type", "application/json");
        w.end(JSON.stringify(body));
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), lockinMockApi()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
