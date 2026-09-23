import { api } from "@/lib/axios";
import type { LeaveRequest } from "@/types";

/**
 * Approved team leave overlapping the given month. Returns a bare array with
 * `user` and `leaveType` populated. `month` is 1-12, not zero-based.
 */
export function getMonth(month: number, year: number, signal?: AbortSignal) {
  return api
    .get<LeaveRequest[]>("/calendar", { params: { month, year }, signal })
    .then((res) => res.data);
}
