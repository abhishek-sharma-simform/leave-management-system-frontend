import { useCallback, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import * as managerApi from "@/api/manager";
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

// This endpoint's Zod allowlist is narrower than the employee one — no
// `status` sort, since sorting by the very field being filtered on is moot.
const SORT_FIELDS = [
  { value: "createdAt", label: "Created" },
  { value: "startDate", label: "Start date" },
] as const;

const STATUSES: LeaveRequestStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

export function PendingRequestsPage() {
  const [page, setPage] = useState(1);
  // Defaults to PENDING — the queue managers land on to act on — but any
  // status (or "all") is one filter change away.
  const [status, setStatus] = useState<string>("PENDING");
  const [sortBy, setSortBy] =
    useState<(typeof SORT_FIELDS)[number]["value"]>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const fetchPending = useCallback(
    (signal: AbortSignal) =>
      managerApi.listPending(
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

  const { data, error, isLoading, reload } = useApiRequest(fetchPending);

  // Any filter/sort change invalidates the current page number.
  function changeFilter(next: () => void) {
    next();
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team requests"
        description="Leave requests from your team, filterable by status."
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
          title="Nothing found"
          description={
            status === ALL_STATUSES
              ? "Your team has no leave requests yet."
              : `Your team has no ${status.toLowerCase()} requests.`
          }
        />
      ) : (
        <div className="rounded-lg border bg-background p-2">
          <LeaveRequestsTable
            requests={data.data}
            linkBase="/manager/requests"
            showEmployee
          />
          <div className="px-2">
            <Pagination meta={data.meta} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
