import { useRef, useState } from "react";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const displayFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// `yyyy-MM-dd` <-> a local Date, deliberately not going through `toISOString`
// (which is UTC and would shift the date back a day for anyone west of GMT).
// The calendar and the `yyyy-MM-dd` form state need to agree on the same
// day regardless of the viewer's timezone.
function parseDateInputValue(value: string): Date | undefined {
  if (!value) return undefined;

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  disabled,
}: {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // react-day-picker's range mode reports a single click as a full range
  // ({from: day, to: day}), not `{from: day, to: undefined}` — so `from &&
  // to` can't tell a completed pick from a first click. Counting clicks
  // since the popover opened can.
  const clicksSinceOpenRef = useRef(0);

  const range: DateRange | undefined = {
    from: parseDateInputValue(startDate),
    to: parseDateInputValue(endDate),
  };

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) clicksSinceOpenRef.current = 0;
  }

  function handleSelect(next: DateRange | undefined) {
    onChange({
      startDate: next?.from ? toDateInputValue(next.from) : "",
      endDate: next?.to ? toDateInputValue(next.to) : "",
    });

    if (!next?.from) {
      // The selection was cleared (e.g. clicking the only selected day
      // again) — that starts a fresh pick, not a completed one.
      clicksSinceOpenRef.current = 0;
      return;
    }

    clicksSinceOpenRef.current += 1;

    // A range picker's usual feel: closing once both ends are picked, rather
    // than making the user dismiss the popover themselves.
    if (clicksSinceOpenRef.current >= 2) {
      setOpen(false);
    }
  }

  const label = range.from
    ? range.to
      ? `${displayFormatter.format(range.from)} – ${displayFormatter.format(range.to)}`
      : `${displayFormatter.format(range.from)} – …`
    : "Select date range";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start font-normal",
            !range.from && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="size-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          defaultMonth={range.from}
          disabled={isWeekend}
        />
      </PopoverContent>
    </Popover>
  );
}
