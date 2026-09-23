import { useState } from "react";
import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as leaveRequestsApi from "@/api/leaveRequests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/errors";
import { toDateInputValue } from "@/lib/format";
import type { LeaveRequest, LeaveType } from "@/types";

/**
 * Its fields are seeded from `request` at mount. The parent gives it a `key`
 * derived from the request, so a saved change remounts it with fresh values
 * instead of syncing props into state from an effect.
 */
export function EditLeaveRequestForm({
  request,
  leaveTypes,
  onChanged,
}: {
  request: LeaveRequest;
  leaveTypes: LeaveType[];
  onChanged: () => void;
}) {
  const [leaveTypeId, setLeaveTypeId] = useState(String(request.leaveTypeId));
  const [startDate, setStartDate] = useState(
    toDateInputValue(request.startDate),
  );
  const [endDate, setEndDate] = useState(toDateInputValue(request.endDate));
  const [reason, setReason] = useState(request.note ?? "");

  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // The backend only allows edits and cancellation while a request is PENDING.
  const canModify = request.status === "PENDING";

  async function handleSave(event: FormEvent) {
    event.preventDefault();

    // Mirrors the backend's Zod `.refine()`; the server still enforces it.
    if (startDate > endDate) {
      toast.error("Start date must be before or equal to end date");
      return;
    }

    setIsSaving(true);

    try {
      await leaveRequestsApi.update(request.id, {
        leaveTypeId: Number(leaveTypeId),
        startDate,
        endDate,
        reason: reason.trim() ? reason.trim() : null,
      });

      toast.success("Request updated");
      onChanged();
    } catch (caught) {
      // Surfaces the server's 409s verbatim (already approved / not pending).
      toast.error(getErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCancel() {
    setIsCancelling(true);

    try {
      await leaveRequestsApi.cancel(request.id);

      toast.success("Request cancelled");
      onChanged();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="editLeaveType">Leave type</Label>
          <Select
            value={leaveTypeId}
            onValueChange={setLeaveTypeId}
            disabled={!canModify}
          >
            <SelectTrigger id="editLeaveType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {leaveTypes.map((leaveType) => (
                <SelectItem key={leaveType.id} value={String(leaveType.id)}>
                  {leaveType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="editStartDate">Start date</Label>
          <Input
            id="editStartDate"
            type="date"
            value={startDate}
            disabled={!canModify}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="editEndDate">End date</Label>
          <Input
            id="editEndDate"
            type="date"
            value={endDate}
            disabled={!canModify}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="editReason">Reason</Label>
        <Textarea
          id="editReason"
          rows={3}
          value={reason}
          disabled={!canModify}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={!canModify || isSaving}>
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </Button>

        <Button
          type="button"
          variant="destructive"
          disabled={!canModify || isCancelling}
          onClick={handleCancel}
        >
          {isCancelling && <Loader2 className="size-4 animate-spin" />}
          Cancel request
        </Button>
      </div>
    </form>
  );
}
