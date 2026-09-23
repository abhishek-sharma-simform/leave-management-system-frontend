import { api } from "@/lib/axios";
import type { LeaveType } from "@/types";

/** GET /leave-types returns a bare array, not a paginated envelope. */
export function list(signal?: AbortSignal) {
  return api
    .get<LeaveType[]>("/leave-types", { signal })
    .then((res) => res.data);
}
