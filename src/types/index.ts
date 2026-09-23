// Mirrors the shapes the backend actually returns (see the sibling
// `leave-management-system` repo). Dates arrive as ISO strings over JSON even
// though they are `DateTime` in Prisma, so they are typed as `string` here.

export type Role = "EMPLOYEE" | "MANAGER";

export type LeaveRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type LeaveDecisionAction = "APPROVED" | "REJECTED";

/** The `user` object embedded in POST /auth/login's response. */
export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

/** GET /leave-types returns a bare array of these. */
export type LeaveType = {
  id: number;
  name: string;
  requiresApproval: boolean;
  drawsFromBalance: boolean;
  defaultAllowanceDays: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * A leave request. Which relations are populated depends on the endpoint:
 * `/leave-requests/me` includes `leaveType`, the manager endpoints also
 * include `user`, and the create/update/cancel responses include neither.
 */
export type LeaveRequest = {
  id: number;
  userId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  daysRequested: number;
  status: LeaveRequestStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  leaveType?: LeaveType;
  user?: { id: number; name: string; email: string };
};

/** Every paginated list endpoint returns this envelope. */
export type Paginated<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/** GET /leave-balances/me */
export type LeaveBalance = {
  leaveTypeId: number;
  leaveTypeName: string;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
};

export type LeaveBalanceResponse = {
  year: number;
  balances: LeaveBalance[];
};

/** One row of GET /leave-requests/:id/history's `history` array. */
export type LeaveDecision = {
  id: number;
  action: LeaveDecisionAction;
  reason: string | null;
  decidedAt: string;
  actor: { id: number; name: string; email: string; role: Role };
};

export type LeaveRequestHistoryResponse = {
  leaveRequest: LeaveRequest;
  history: LeaveDecision[];
};

/**
 * GET /manager/requests/:id — the request itself, spread at the top level,
 * plus the other team members whose leave overlaps these dates. Its
 * `decisions` come straight from Prisma, so they carry `actorId`/`requestId`
 * rather than the nested `actor` the history endpoint returns.
 */
export type ManagerRequestDetail = LeaveRequest & {
  decisions: {
    id: number;
    requestId: number;
    actorId: number;
    action: LeaveDecisionAction;
    reason: string | null;
    decidedAt: string;
  }[];
  overlappingRequests: LeaveRequest[];
};

export type SortOrder = "asc" | "desc";

/**
 * One row of GET /manager/decisions — every approve/reject the calling
 * manager has ever made, regardless of which of their reports (past or
 * present) it was on.
 */
export type ManagerDecision = {
  id: number;
  requestId: number;
  actorId: number;
  action: LeaveDecisionAction;
  reason: string | null;
  decidedAt: string;
  request: LeaveRequest & {
    user: { id: number; name: string; email: string };
    leaveType: LeaveType;
  };
};

/** One entry of GET /leave-requests/team-on-leave's `teammatesOnLeave` array. */
export type TeammateOnLeave = {
  userId: number;
  name: string;
  email: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: LeaveRequestStatus;
};

/** GET /leave-requests/team-on-leave */
export type TeamOnLeaveResponse = {
  startDate: string;
  endDate: string;
  teammatesOnLeave: TeammateOnLeave[];
};
