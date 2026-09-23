import { api } from "@/lib/axios";
import type {
  LeaveRequest,
  LeaveRequestHistoryResponse,
  LeaveRequestStatus,
  Paginated,
  SortOrder,
  TeammateOnLeave,
  TeamOnLeaveResponse,
} from "@/types";

export type ListMineParams = {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "startDate" | "status";
  sortOrder?: SortOrder;
  status?: LeaveRequestStatus;
};

export type CreateLeaveRequestBody = {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason?: string | null;
};

/** PATCH accepts any subset of the create fields. */
export type UpdateLeaveRequestBody = Partial<CreateLeaveRequestBody>;

export function listMine(params: ListMineParams, signal?: AbortSignal) {
  return api
    .get<Paginated<LeaveRequest>>("/leave-requests/me", { params, signal })
    .then((res) => res.data);
}

export function create(body: CreateLeaveRequestBody) {
  return api
    .post<LeaveRequest>("/leave-requests", body)
    .then((res) => res.data);
}

export function update(id: number, body: UpdateLeaveRequestBody) {
  return api
    .patch<LeaveRequest>(`/leave-requests/me/${id}`, body)
    .then((res) => res.data);
}

export function cancel(id: number) {
  return api
    .post<LeaveRequest>(`/leave-requests/me/${id}/cancel`)
    .then((res) => res.data);
}

/**
 * Serves both roles: the owner and their manager may both read a request's
 * history, which is also the only endpoint that returns a single request.
 */
export function history(id: number, signal?: AbortSignal) {
  return api
    .get<LeaveRequestHistoryResponse>(`/leave-requests/${id}/history`, {
      signal,
    })
    .then((res) => res.data);
}

/**
 * Teammates (same manager, excluding the caller) whose leave overlaps the
 * given range. Requires no particular role — an employee sees their own
 * teammates, a manager sees theirs.
 */
export function teamOnLeave(
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
): Promise<TeammateOnLeave[]> {
  return api
    .get<TeamOnLeaveResponse>("/leave-requests/team-on-leave", {
      params: { startDate, endDate },
      signal,
    })
    .then((res) => res.data.teammatesOnLeave);
}
