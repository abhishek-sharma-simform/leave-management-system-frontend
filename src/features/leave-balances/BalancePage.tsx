import { useCallback, useState } from "react";
import * as leaveBalancesApi from "@/api/leaveBalances";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
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

const CURRENT_YEAR = new Date().getFullYear();
// The backend accepts 1970-2100; a short window around today is enough here.
const YEAR_OPTIONS = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1];

export function BalancePage() {
  const [year, setYear] = useState(CURRENT_YEAR);

  const fetchBalances = useCallback(
    (signal: AbortSignal) => leaveBalancesApi.getMine(year, signal),
    [year],
  );
  const { data, error, isLoading, reload } = useApiRequest(fetchBalances);

  const balances = data?.balances ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave balances"
        description="Allocated, used and remaining days per leave type."
        action={
          <Select
            value={String(year)}
            onValueChange={(value) => setYear(Number(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : balances.length === 0 ? (
        <EmptyState
          title={`No balances for ${year}`}
          description="Balances are allocated per year — try a different year."
        />
      ) : (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave type</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map((balance) => (
                <TableRow key={balance.leaveTypeId}>
                  <TableCell className="font-medium">
                    {balance.leaveTypeName}
                  </TableCell>
                  <TableCell className="text-right">
                    {balance.allocatedDays}
                  </TableCell>
                  <TableCell className="text-right">
                    {balance.usedDays}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {balance.remainingDays}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
