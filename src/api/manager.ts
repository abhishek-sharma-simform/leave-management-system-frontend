import { api } from "@/lib/axios";
import type {
  LeaveRequest,
  ManagerRequestDetail,
  Paginated,
  SortOrder,
} from "@/types";

export type ListPendingParams = {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "startDate";
  sortOrder?: SortOrder;
};

/** Hardcoded to PENDING server-side, so there is no status filter here. */
export function listPending(params: ListPendingParams, signal?: AbortSignal) {
  return api
    .get<Paginated<LeaveRequest>>("/manager/requests", { params, signal })
    .then((res) => res.data);
}

export function getById(id: number, signal?: AbortSignal) {
  return api
    .get<ManagerRequestDetail>(`/manager/requests/${id}`, { signal })
    .then((res) => res.data);
}

export function approve(id: number) {
  return api
    .post<{ message: string }>(`/manager/requests/${id}/approve`)
    .then((res) => res.data);
}

export function reject(id: number, reason: string) {
  return api
    .post<{ message: string }>(`/manager/requests/${id}/reject`, { reason })
    .then((res) => res.data);
}
