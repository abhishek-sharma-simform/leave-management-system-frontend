import { api } from "@/lib/axios";
import type { LeaveBalanceResponse } from "@/types";

export function getMine(year: number, signal?: AbortSignal) {
  return api
    .get<LeaveBalanceResponse>("/leave-balances/me", {
      params: { year },
      signal,
    })
    .then((res) => res.data);
}
