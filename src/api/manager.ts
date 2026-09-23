import { api } from "@/lib/axios";
import type {
  LeaveDecisionAction,
  LeaveRequest,
  LeaveRequestStatus,
  ManagerDecision,
  ManagerRequestDetail,
  Paginated,
  SortOrder,
} from "@/types";

export type ListPendingParams = {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "startDate";
  sortOrder?: SortOrder;
  /** Omitting this returns requests in every status. */
  status?: LeaveRequestStatus;
};

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

export type ListDecisionsParams = {
  page?: number;
  limit?: number;
  sortOrder?: SortOrder;
  /** Omitting this returns both approvals and rejections. */
  action?: LeaveDecisionAction;
};

/**
 * The calling manager's own audit trail — every approve/reject they've made,
 * across every report. Only sortable by `decidedAt` server-side, so that's
 * hardcoded rather than exposed as a param.
 */
export function listDecisions(params: ListDecisionsParams, signal?: AbortSignal) {
  return api
    .get<Paginated<ManagerDecision>>("/manager/decisions", {
      params: { ...params, sortBy: "decidedAt" },
      signal,
    })
    .then((res) => res.data);
}
