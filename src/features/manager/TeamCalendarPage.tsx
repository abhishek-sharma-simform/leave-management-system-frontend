import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import * as calendarApi from "@/api/calendar";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiRequest } from "@/hooks/useApiRequest";
import { MONTH_NAMES } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LeaveRequest } from "@/types";

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();

type DayColor = { name: string; bg: string; text: string; dot: string };

// The three leave types this app actually has (see LeaveType seed data).
// Unpaid gets a warm, warning-like color since — unlike Casual/Sick — it
// costs the employee pay, so it should read as visually distinct at a glance.
const KNOWN_LEAVE_COLORS: Record<string, Omit<DayColor, "name">> = {
  "Casual Leave": { bg: "bg-sky-500", text: "text-white", dot: "bg-sky-500" },
  "Sick Leave": {
    bg: "bg-violet-500",
    text: "text-white",
    dot: "bg-violet-500",
  },
  "Unpaid Leave": {
    bg: "bg-orange-500",
    text: "text-white",
    dot: "bg-orange-500",
  },
};
const WEEKEND_COLOR: DayColor = {
  name: "Week-off",
  bg: "bg-amber-300",
  text: "text-amber-950",
  dot: "bg-amber-300",
};
// Cycled through for any leave type outside the known three (e.g. a new one
// added later via the leave-types admin), so it still renders distinctly.
const FALLBACK_COLORS: Omit<DayColor, "name">[] = [
  { bg: "bg-teal-500", text: "text-white", dot: "bg-teal-500" },
  { bg: "bg-rose-500", text: "text-white", dot: "bg-rose-500" },
  { bg: "bg-fuchsia-500", text: "text-white", dot: "bg-fuchsia-500" },
];

const AVATAR_COLORS = [
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-cyan-100 text-cyan-700",
];

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "UTC",
});

// Requests are stored as UTC midnight, so every calendar computation below
// stays in UTC too — otherwise a user west of GMT sees leave shifted a day.
function daysInMonth(month: number, year: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function weekdayLetters(year: number, month: number, day: number) {
  return WEEKDAY_FORMATTER.format(
    new Date(Date.UTC(year, month - 1, day)),
  ).slice(0, 2);
}

function isWeekend(year: number, month: number, day: number) {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 || weekday === 6;
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
}

export function TeamCalendarPage() {
  // The API takes a 1-12 month, not a zero-based one.
  const [month, setMonth] = useState(TODAY.getMonth() + 1);
  const [year, setYear] = useState(CURRENT_YEAR);

  function goToPrevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function goToNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  const fetchCalendar = useCallback(
    (signal: AbortSignal) => calendarApi.getMonth(month, year, signal),
    [month, year],
  );

  const { data, error, isLoading, reload } = useApiRequest(fetchCalendar);

  const requests = useMemo(() => data ?? [], [data]);

  const byEmployee = useMemo(() => {
    const groups = new Map<
      number,
      { id: number; name: string; items: LeaveRequest[] }
    >();

    for (const request of requests) {
      const key = request.userId;
      const existing = groups.get(key);

      if (existing) {
        existing.items.push(request);
      } else {
        groups.set(key, {
          id: key,
          name: request.user?.name ?? `User #${key}`,
          items: [request],
        });
      }
    }

    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [requests]);

  // One color per leave type name, assigned in first-seen order so the
  // legend and the grid cells always agree.
  const leaveTypeColors = useMemo(() => {
    const colors = new Map<string, DayColor>();
    let fallbackCursor = 0;

    for (const request of requests) {
      const name = request.leaveType?.name ?? `Type #${request.leaveTypeId}`;
      if (colors.has(name)) continue;

      const known = KNOWN_LEAVE_COLORS[name];
      if (known) {
        colors.set(name, { name, ...known });
      } else {
        colors.set(name, {
          name,
          ...FALLBACK_COLORS[fallbackCursor % FALLBACK_COLORS.length],
        });
        fallbackCursor += 1;
      }
    }

    return colors;
  }, [requests]);

  // employeeId -> day of month -> color, clipped to the days actually in view.
  const leaveByEmployeeDay = useMemo(() => {
    const map = new Map<number, Map<number, DayColor>>();

    for (const request of requests) {
      const name = request.leaveType?.name ?? `Type #${request.leaveTypeId}`;
      const color = leaveTypeColors.get(name);
      if (!color) continue;

      let employeeDays = map.get(request.userId);
      if (!employeeDays) {
        employeeDays = new Map();
        map.set(request.userId, employeeDays);
      }

      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      const cursor = new Date(
        Date.UTC(
          start.getUTCFullYear(),
          start.getUTCMonth(),
          start.getUTCDate(),
        ),
      );
      const endUtc = new Date(
        Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
      );

      while (cursor <= endUtc) {
        if (
          cursor.getUTCFullYear() === year &&
          cursor.getUTCMonth() + 1 === month
        ) {
          employeeDays.set(cursor.getUTCDate(), color);
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }

    return map;
  }, [requests, leaveTypeColors, year, month]);

  const totalDays = daysInMonth(month, year);
  const days = useMemo(
    () => Array.from({ length: totalDays }, (_, index) => index + 1),
    [totalDays],
  );

  const legend = [...leaveTypeColors.values(), WEEKEND_COLOR];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team calendar"
        description="Approved leave across your team for the selected month."
        action={
          <div className="flex items-center gap-1 rounded-md border bg-background p-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={goToPrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-28 text-center text-sm font-medium">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={goToNextMonth}
              aria-label="Next month"
            >
              <ChevronRight />
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : byEmployee.length === 0 ? (
        <EmptyState
          title={`No approved leave in ${MONTH_NAMES[month - 1]} ${year}`}
          description="Only approved requests appear on the team calendar."
        />
      ) : (
        <div className="rounded-md border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-40 bg-card px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Member
                  </th>
                  {days.map((day) => (
                    <th
                      key={day}
                      className="min-w-9 px-1 py-3 text-center text-xs font-normal text-muted-foreground"
                    >
                      {weekdayLetters(year, month, day)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byEmployee.map((group, index) => (
                  <tr key={group.id} className="border-t">
                    <td className="sticky left-0 z-10 min-w-40 bg-card px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            AVATAR_COLORS[index % AVATAR_COLORS.length],
                          )}
                        >
                          {getInitials(group.name)}
                        </span>
                        <span className="whitespace-nowrap font-medium">
                          {group.name}
                        </span>
                      </div>
                    </td>
                    {days.map((day) => {
                      const color =
                        leaveByEmployeeDay.get(group.id)?.get(day) ??
                        (isWeekend(year, month, day)
                          ? WEEKEND_COLOR
                          : undefined);

                      return (
                        <td key={day} className="p-1 text-center">
                          <span
                            className={cn(
                              "mx-auto flex size-7 items-center justify-center rounded-full text-xs font-medium",
                              color
                                ? cn(color.bg, color.text)
                                : "text-muted-foreground",
                            )}
                          >
                            {day}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t px-4 py-3">
            {legend.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span className={cn("size-2.5 rounded-full", entry.dot)} />
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
