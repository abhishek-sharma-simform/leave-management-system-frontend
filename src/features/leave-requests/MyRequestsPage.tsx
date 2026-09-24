import { useCallback, useState } from "react";
import { ArrowDownUp, FilePlus2 } from "lucide-react";
import { Link } from "react-router-dom";
import * as leaveRequestsApi from "@/api/leaveRequests";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LeaveRequestsTable } from "@/components/shared/LeaveRequestsTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiRequest } from "@/hooks/useApiRequest";
import type { LeaveRequestStatus, SortOrder } from "@/types";

const PAGE_SIZE = 10;
const ALL_STATUSES = "ALL";

// Only the fields the backend's Zod allowlist accepts for sortBy.
const SORT_FIELDS = [
  { value: "createdAt", label: "Created" },
  { value: "startDate", label: "Start date" },
  { value: "status", label: "Status" },
] as const;

const STATUSES: LeaveRequestStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

export function MyRequestsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>(ALL_STATUSES);
  const [sortBy, setSortBy] =
    useState<(typeof SORT_FIELDS)[number]["value"]>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const fetchRequests = useCallback(
    (signal: AbortSignal) =>
      leaveRequestsApi.listMine(
        {
          page,
          limit: PAGE_SIZE,
          sortBy,
          sortOrder,
          // The API rejects an unknown status, so "all" means omitting it.
          status:
            status === ALL_STATUSES
              ? undefined
              : (status as LeaveRequestStatus),
        },
        signal,
      ),
    [page, sortBy, sortOrder, status],
  );

  const { data, error, isLoading, reload } = useApiRequest(fetchRequests);

  // Any filter/sort change invalidates the current page number.
  function changeFilter(next: () => void) {
    next();
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My requests"
        description="Every leave request you have submitted."
        action={
          <Button asChild>
            <Link to="/leave-requests/apply">
              <FilePlus2 className="size-4" />
              Apply for leave
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={status}
          onValueChange={(value) => changeFilter(() => setStatus(value))}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {STATUSES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(value) =>
            changeFilter(() =>
              setSortBy(value as (typeof SORT_FIELDS)[number]["value"]),
            )
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_FIELDS.map((field) => (
              <SelectItem key={field.value} value={field.value}>
                Sort by {field.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() =>
            changeFilter(() =>
              setSortOrder(sortOrder === "asc" ? "desc" : "asc"),
            )
          }
        >
          <ArrowDownUp className="size-4" />
          {sortOrder === "asc" ? "Ascending" : "Descending"}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No requests found"
          description={
            status === ALL_STATUSES
              ? "You have not submitted any leave requests yet."
              : `You have no ${status.toLowerCase()} requests.`
          }
        />
      ) : (
        <div className="rounded-lg border bg-background p-2">
          <LeaveRequestsTable requests={data.data} />
          <div className="px-2">
            <Pagination meta={data.meta} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
