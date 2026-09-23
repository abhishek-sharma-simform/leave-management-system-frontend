import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeaveRequestStatus } from "@/types";

const STATUS_STYLES: Record<LeaveRequestStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  CANCELLED: "bg-slate-100 text-slate-700 border-slate-200",
};

export function StatusBadge({
  status,
  className,
}: {
  status: LeaveRequestStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_STYLES[status], "font-medium", className)}
    >
      {status}
    </Badge>
  );
}
