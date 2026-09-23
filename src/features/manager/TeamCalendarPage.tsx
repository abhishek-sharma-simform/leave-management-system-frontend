import { useCallback, useMemo, useState } from "react";
import * as calendarApi from "@/api/calendar";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { MONTH_NAMES, formatDate } from "@/lib/format";
import type { LeaveRequest } from "@/types";

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1];

export function TeamCalendarPage() {
  // The API takes a 1-12 month, not a zero-based one.
  const [month, setMonth] = useState(TODAY.getMonth() + 1);
  const [year, setYear] = useState(CURRENT_YEAR);

  const fetchCalendar = useCallback(
    (signal: AbortSignal) => calendarApi.getMonth(month, year, signal),
    [month, year],
  );

  const { data, error, isLoading, reload } = useApiRequest(fetchCalendar);

  const requests = useMemo(() => data ?? [], [data]);

  // Grouped by employee rather than drawn as a month grid — the point here is
  // seeing who is away and when, which a list conveys without a calendar lib.
  const byEmployee = useMemo(() => {
    const groups = new Map<number, { name: string; items: LeaveRequest[] }>();

    for (const request of requests) {
      const key = request.userId;
      const existing = groups.get(key);

      if (existing) {
        existing.items.push(request);
      } else {
        groups.set(key, {
          name: request.user?.name ?? `User #${key}`,
          items: [request],
        });
      }
    }

    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [requests]);

  const totalDaysAway = requests.reduce(
    (sum, request) => sum + request.daysRequested,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team calendar"
        description="Approved leave across your team for the selected month."
        action={
          <div className="flex gap-2">
            <Select
              value={String(month)}
              onValueChange={(value) => setMonth(Number(value))}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, index) => (
                  <SelectItem key={name} value={String(index + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(year)}
              onValueChange={(value) => setYear(Number(value))}
            >
              <SelectTrigger className="w-28">
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
          </div>
        }
      />

      {isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : requests.length === 0 ? (
        <EmptyState
          title={`No approved leave in ${MONTH_NAMES[month - 1]} ${year}`}
          description="Only approved requests appear on the team calendar."
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {byEmployee.length} team member(s) away · {totalDaysAway} working
            day(s) total
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {byEmployee.map((group) => (
              <Card key={group.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{group.name}</CardTitle>
                  <CardDescription>
                    {group.items.length} approved request(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leave type</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead className="text-right">Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            {request.leaveType?.name ??
                              `Type #${request.leaveTypeId}`}
                          </TableCell>
                          <TableCell>{formatDate(request.startDate)}</TableCell>
                          <TableCell>{formatDate(request.endDate)}</TableCell>
                          <TableCell className="text-right">
                            {request.daysRequested}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
