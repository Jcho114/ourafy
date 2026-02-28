import type { LockinOption, LockinOptionsResponse } from "@/features/lockin/types";

export const mockLockinOptions: LockinOption[] = [
  {
    id: "standard",
    apps_to_open: ["VSCode", "Notion"],
    pomodoro: { minutes_on: 25, minutes_off: 5, cycles: 4 },
    reason:
      "Classic cadence for consistent progress with minimal setup. Balanced work/break rhythm.",
  },
  {
    id: "recover",
    apps_to_open: ["VSCode", "Notion"],
    pomodoro: { minutes_on: 20, minutes_off: 10, cycles: 3 },
    reason:
      "Shorter focus blocks and longer breaks to keep energy steady. Fewer apps to reduce context switching.",
  },
  {
    id: "sprint",
    apps_to_open: ["VSCode"],
    pomodoro: { minutes_on: 35, minutes_off: 5, cycles: 3 },
    reason:
      "Longer focus blocks to push through a chunk of work. Best when you already know the next steps.",
  },
];

export function mockLockinResponse(): LockinOptionsResponse {
  return { data: mockLockinOptions };
}
