import { useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import * as leaveRequestsApi from "@/api/leaveRequests";
import * as leaveTypesApi from "@/api/leaveTypes";
import { DecisionHistory } from "@/components/shared/DecisionHistory";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { EditLeaveRequestForm } from "@/features/leave-requests/EditLeaveRequestForm";
import { useApiRequest } from "@/hooks/useApiRequest";
import { formatDate, formatDateTime } from "@/lib/format";

export function RequestDetailPage() {
  const { id } = useParams();
  const requestId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  // `/history` is the only endpoint that returns a single request, and it does
  // not include the leave type — so the type list is fetched alongside it to
  // resolve the name and to populate the edit dropdown.
  const fetchDetail = useCallback(
    (signal: AbortSignal) =>
      Promise.all([
        leaveRequestsApi.history(requestId, signal),
        leaveTypesApi.list(signal),
      ]),
    [requestId],
  );

  const { data, error, isLoading, reload } = useApiRequest(fetchDetail);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Request not found"} onRetry={reload} />;
  }

  const [{ leaveRequest: request, history }, leaveTypes] = data;

  const isOwner = request.userId === user?.id;
  const leaveTypeName =
    leaveTypes.find((type) => type.id === request.leaveTypeId)?.name ??
    `Type #${request.leaveTypeId}`;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <PageHeader
        title={`Request #${request.id}`}
        description={`Submitted ${formatDateTime(request.createdAt)}`}
        action={<StatusBadge status={request.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Leave type</dt>
              <dd className="font-medium">{leaveTypeName}</dd>

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
            <CardTitle>Decision history</CardTitle>
            <CardDescription>
              Approvals and rejections recorded against this request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DecisionHistory decisions={history} />
          </CardContent>
        </Card>
      </div>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Edit request</CardTitle>
            <CardDescription>
              {request.status === "PENDING"
                ? "Pending requests can be edited or cancelled."
                : `This request is ${request.status.toLowerCase()} and can no longer be changed.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* The key remounts the form with the saved values after a change. */}
            <EditLeaveRequestForm
              key={request.updatedAt}
              request={request}
              leaveTypes={leaveTypes}
              onChanged={reload}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
