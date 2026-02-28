import axios from "axios";

import type { LockinOptionsResponse } from "@/features/lockin/types";
import { mockLockinResponse } from "@/features/lockin/mock";

export type LockinOptionsParams = {
  focus: string;
  blockers?: string;
  task_type?: string;
  priority?: string;
  time_available_min?: number;
  hard_stop?: string;
};

export async function getLockinOptions(params: LockinOptionsParams) {
  try {
    const res = await axios.get<LockinOptionsResponse>("/api/lockin-options", {
      params,
    });
    return res.data;
  } catch {
    return mockLockinResponse();
  }
}
