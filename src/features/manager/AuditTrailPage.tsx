import { useCallback, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as managerApi from "@/api/manager";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApiRequest } from "@/hooks/useApiRequest";
import { formatDate, formatDateTime } from "@/lib/format";
import type { LeaveDecisionAction, SortOrder } from "@/types";

const PAGE_SIZE = 10;
const ALL_ACTIONS = "ALL";

const ACTIONS: LeaveDecisionAction[] = ["APPROVED", "REJECTED"];

export function AuditTrailPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<string>(ALL_ACTIONS);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const fetchDecisions = useCallback(
    (signal: AbortSignal) =>
      managerApi.listDecisions(
        {
          page,
          limit: PAGE_SIZE,
          sortOrder,
          // The API rejects an unknown action, so "all" means omitting it.
          action:
            action === ALL_ACTIONS
              ? undefined
              : (action as LeaveDecisionAction),
        },
        signal,
      ),
    [page, sortOrder, action],
  );

  const { data, error, isLoading, reload } = useApiRequest(fetchDecisions);

  // Any filter/sort change invalidates the current page number.
  function changeFilter(next: () => void) {
    next();
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit trail"
        description="Every approval and rejection decision you've made, across your team."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={action}
          onValueChange={(value) => changeFilter(() => setAction(value))}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ACTIONS}>All decisions</SelectItem>
            {ACTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
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
          {sortOrder === "asc" ? "Oldest first" : "Newest first"}
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
            action === ALL_ACTIONS
              ? "You haven't made any leave decisions yet."
              : `You haven't ${action === "APPROVED" ? "approved" : "rejected"} any requests yet.`
          }
        />
      ) : (
        <div className="rounded-lg border bg-background p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Request status</TableHead>
                <TableHead>Decided at</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.data.map((decision) => (
                <TableRow
                  key={decision.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate(`/manager/requests/${decision.requestId}`)
                  }
                >
                  <TableCell className="font-medium">
                    {decision.request.user.name}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {decision.request.user.email}
                    </span>
                  </TableCell>
                  <TableCell>{decision.request.leaveType.name}</TableCell>
                  <TableCell>{formatDate(decision.request.startDate)}</TableCell>
                  <TableCell>{formatDate(decision.request.endDate)}</TableCell>
                  <TableCell className="text-right">
                    {decision.request.daysRequested}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={decision.action} />
                  </TableCell>
                  <TableCell
                    className="max-w-[200px] truncate"
                    title={decision.reason ?? undefined}
                  >
                    {decision.reason ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={decision.request.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(decision.decidedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="px-2">
            <Pagination meta={data.meta} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
