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
import type { SortOrder } from "@/types";

const PAGE_SIZE = 10;

// This endpoint's Zod allowlist is narrower than the employee one — no
// `status` sort, because the list is hardcoded to PENDING server-side.
const SORT_FIELDS = [
  { value: "createdAt", label: "Created" },
  { value: "startDate", label: "Start date" },
] as const;

export function PendingRequestsPage() {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] =
    useState<(typeof SORT_FIELDS)[number]["value"]>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const fetchPending = useCallback(
    (signal: AbortSignal) =>
      managerApi.listPending(
        { page, limit: PAGE_SIZE, sortBy, sortOrder },
        signal,
      ),
    [page, sortBy, sortOrder],
  );

  const { data, error, isLoading, reload } = useApiRequest(fetchPending);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending requests"
        description="Leave requests from your team that are waiting on you."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={sortBy}
          onValueChange={(value) => {
            setSortBy(value as (typeof SORT_FIELDS)[number]["value"]);
            setPage(1);
          }}
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
          onClick={() => {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            setPage(1);
          }}
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
          title="Nothing pending"
          description="Your team has no leave requests awaiting a decision."
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
