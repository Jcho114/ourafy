import axios from "axios";

import type { OuraSnapshotResponse } from "@/features/oura/types";
import { demoOura } from "@/features/oura/demo";

export type OuraSnapshotParams = {
  day?: string;
};

export async function getOuraSnapshot(params: OuraSnapshotParams = {}) {
  try {
    const res = await axios.get<OuraSnapshotResponse>("/api/oura-snapshot", {
      params,
    });
    return res.data;
  } catch {
    return demoOura;
  }
}
