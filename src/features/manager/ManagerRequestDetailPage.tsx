import { useCallback, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, Loader2, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import * as managerApi from "@/api/manager";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useApiRequest } from "@/hooks/useApiRequest";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/format";

export function ManagerRequestDetailPage() {
  const { id } = useParams();
  const requestId = Number(id);
  const navigate = useNavigate();

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRequest = useCallback(
    (signal: AbortSignal) => managerApi.getById(requestId, signal),
    [requestId],
  );

  const { data: request, error, isLoading, reload } = useApiRequest(fetchRequest);

  async function handleApprove() {
    setIsApproving(true);

    try {
      const response = await managerApi.approve(requestId);

      toast.success(response.message);
      // Refetch rather than patching local state: approving also moves the
      // balance, and the server is the source of truth for both.
      reload();
    } catch (caught) {
      // Covers the concurrency-guarded "Insufficient leave balance" path.
      toast.error(getErrorMessage(caught));
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    setIsRejecting(true);

    try {
      const response = await managerApi.reject(requestId, rejectReason.trim());

      toast.success(response.message);
      setIsRejectOpen(false);
      setRejectReason("");
      reload();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsRejecting(false);
    }
  }

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error || !request) {
    return <ErrorState message={error ?? "Request not found"} onRetry={reload} />;
  }

  const isPending = request.status === "PENDING";

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <PageHeader
        title={`Request #${request.id}`}
        description={`From ${request.user?.name ?? `user #${request.userId}`} · submitted ${formatDateTime(request.createdAt)}`}
        action={<StatusBadge status={request.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Employee</dt>
              <dd className="font-medium">
                {request.user?.name}
                {request.user?.email && (
                  <span className="block text-xs font-normal text-muted-foreground">
                    {request.user.email}
                  </span>
                )}
              </dd>

              <dt className="text-muted-foreground">Leave type</dt>
              <dd className="font-medium">
                {request.leaveType?.name ?? `Type #${request.leaveTypeId}`}
              </dd>

              <dt className="text-muted-foreground">From</dt>
              <dd className="font-medium">{formatDate(request.startDate)}</dd>

              <dt className="text-muted-foreground">To</dt>
              <dd className="font-medium">{formatDate(request.endDate)}</dd>

              <dt className="text-muted-foreground">Working days</dt>
              <dd className="font-medium">{request.daysRequested}</dd>

              <dt className="text-muted-foreground">Reason</dt>
              <dd className="font-medium">{request.note || "—"}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overlapping team leave</CardTitle>
            <CardDescription>
              Approved or pending leave from the rest of your team across these
              dates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {request.overlappingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No one else on your team is away during this period.
              </p>
            ) : (
              <ul className="space-y-3">
                {request.overlappingRequests.map((overlap) => (
                  <li
                    key={overlap.id}
                    className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-3"
                  >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <div className="text-sm">
                      <p className="font-medium">
                        {overlap.user?.name ?? `User #${overlap.userId}`}
                      </p>
                      <p className="text-muted-foreground">
                        {formatDate(overlap.startDate)} –{" "}
                        {formatDate(overlap.endDate)} · {overlap.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Decision</CardTitle>
          <CardDescription>
            {isPending
              ? "Approving deducts the days from the employee's balance."
              : `This request has already been ${request.status.toLowerCase()}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button disabled={!isPending || isApproving} onClick={handleApprove}>
            {isApproving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Approve
          </Button>

          <Button
            variant="destructive"
            disabled={!isPending}
            onClick={() => setIsRejectOpen(true)}
          >
            <X className="size-4" />
            Reject
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject request #{request.id}</DialogTitle>
            <DialogDescription>
              A reason is required and is recorded in the request's history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="rejectReason">Reason</Label>
            <Textarea
              id="rejectReason"
              rows={3}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Why is this request being rejected?"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || isRejecting}
              onClick={handleReject}
            >
              {isRejecting && <Loader2 className="size-4 animate-spin" />}
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
