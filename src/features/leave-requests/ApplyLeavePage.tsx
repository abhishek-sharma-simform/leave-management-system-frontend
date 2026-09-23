import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as leaveRequestsApi from "@/api/leaveRequests";
import * as leaveTypesApi from "@/api/leaveTypes";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useApiRequest } from "@/hooks/useApiRequest";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import type { TeammateOnLeave } from "@/types";

function teammateDateLabel(teammate: TeammateOnLeave) {
  const start = formatDate(teammate.startDate);
  const end = formatDate(teammate.endDate);
  return start === end ? start : `${start} – ${end}`;
}

export function ApplyLeavePage() {
  const navigate = useNavigate();

  const fetchLeaveTypes = useCallback(
    (signal: AbortSignal) => leaveTypesApi.list(signal),
    [],
  );
  const {
    data: leaveTypes,
    error: loadError,
    isLoading: isLoadingTypes,
  } = useApiRequest(fetchLeaveTypes);

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRangeComplete = Boolean(
    startDate && endDate && startDate <= endDate,
  );

  const fetchTeamOnLeave = useCallback(
    (signal: AbortSignal) =>
      isRangeComplete
        ? leaveRequestsApi.teamOnLeave(startDate, endDate, signal)
        : Promise.resolve([]),
    [isRangeComplete, startDate, endDate],
  );
  const {
    data: teammatesOnLeave,
    error: teamOnLeaveError,
    isLoading: isLoadingTeamOnLeave,
  } = useApiRequest(fetchTeamOnLeave);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!startDate || !endDate) {
      toast.error("Select a start and end date");
      return;
    }

    // Mirrors the backend's Zod `.refine()` so an obvious mistake is caught
    // without a round trip. The server still enforces it either way.
    if (startDate > endDate) {
      toast.error("Start date must be before or equal to end date");
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await leaveRequestsApi.create({
        leaveTypeId: Number(leaveTypeId),
        startDate,
        endDate,
        reason: reason.trim() ? reason.trim() : null,
      });

      toast.success(
        `Request submitted for ${created.daysRequested} working day(s)`,
      );
      navigate(`/leave-requests/${created.id}`);
    } catch (caught) {
      // Covers the balance and leave-type checks the server does on create.
      toast.error(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Apply for leave"
        description="Weekends are excluded automatically when days are counted."
      />

      {isLoadingTypes ? (
        <Skeleton className="h-96 w-full max-w-2xl" />
      ) : loadError || !leaveTypes ? (
        <ErrorState message={loadError ?? "Could not load leave types"} />
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leaveType">Leave type</Label>
                <Select
                  value={leaveTypeId}
                  onValueChange={setLeaveTypeId}
                  required
                >
                  <SelectTrigger id="leaveType">
                    <SelectValue placeholder="Select a leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((leaveType) => (
                      <SelectItem
                        key={leaveType.id}
                        value={String(leaveType.id)}
                      >
                        {leaveType.name}
                        {leaveType.drawsFromBalance
                          ? ` (${leaveType.defaultAllowanceDays} days/year)`
                          : " (does not draw from balance)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Leave dates</Label>
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(range) => {
                    setStartDate(range.startDate);
                    setEndDate(range.endDate);
                  }}
                />
              </div>

              {isRangeComplete && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Also on leave during this period
                  </p>
                  {isLoadingTeamOnLeave ? (
                    <div className="flex gap-2">
                      <Skeleton className="size-8 rounded-full" />
                      <Skeleton className="size-8 rounded-full" />
                    </div>
                  ) : teamOnLeaveError ? (
                    <p className="text-sm text-destructive">
                      {teamOnLeaveError}
                    </p>
                  ) : teammatesOnLeave && teammatesOnLeave.length > 0 ? (
                    <div className="flex -space-x-2">
                      {teammatesOnLeave.map((teammate) => (
                        <Tooltip key={`${teammate.userId}-${teammate.startDate}`}>
                          <TooltipTrigger asChild>
                            <Avatar className="border-2 border-background">
                              <AvatarFallback>
                                <UserRound className="size-4 text-muted-foreground" />
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{teammate.name}</p>
                            <p className="text-primary-foreground/80">
                              {teammateDateLabel(teammate)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No one else on your team is on leave in this period.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  rows={3}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Anything your manager should know"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !leaveTypeId || !startDate || !endDate
                  }
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Submit request
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
