import { useCallback } from "react";
import { FilePlus2 } from "lucide-react";
import { Link } from "react-router-dom";
import * as leaveBalancesApi from "@/api/leaveBalances";
import * as leaveRequestsApi from "@/api/leaveRequests";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LeaveRequestsTable } from "@/components/shared/LeaveRequestsTable";
import { PageHeader } from "@/components/shared/PageHeader";
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
import { useApiRequest } from "@/hooks/useApiRequest";

const CURRENT_YEAR = new Date().getFullYear();
const RECENT_REQUEST_COUNT = 5;

export function DashboardPage() {
  const { user } = useAuth();

  // Both panels are independent, so they are fetched together rather than in
  // series — one round trip's worth of latency instead of two.
  const fetchDashboard = useCallback(
    (signal: AbortSignal) =>
      Promise.all([
        leaveBalancesApi.getMine(CURRENT_YEAR, signal),
        leaveRequestsApi.listMine(
          { limit: RECENT_REQUEST_COUNT, page: 1 },
          signal,
        ),
      ]),
    [],
  );

  const { data, error, isLoading, reload } = useApiRequest(fetchDashboard);

  const balances = data?.[0].balances ?? [];
  const recentRequests = data?.[1].data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${user?.name ?? ""}`}
        description={`Your leave balances and latest requests for ${CURRENT_YEAR}.`}
        action={
          <Button asChild>
            <Link to="/leave-requests/apply">
              <FilePlus2 className="size-4" />
              Apply for leave
            </Link>
          </Button>
        }
      />

      {balances.length === 0 ? (
        <EmptyState
          title={`No leave balances allocated for ${CURRENT_YEAR}`}
          description="Managers do not get their own balances in the seed data."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {balances.map((balance) => (
            <Card key={balance.leaveTypeId}>
              <CardHeader className="pb-2">
                <CardDescription>{balance.leaveTypeName}</CardDescription>
                <CardTitle className="text-3xl">
                  {balance.remainingDays}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    days left
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {balance.usedDays} used of {balance.allocatedDays} allocated
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Recent requests</CardTitle>
            <CardDescription>
              Your {RECENT_REQUEST_COUNT} most recent leave requests.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/leave-requests/me">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <EmptyState
              title="No leave requests yet"
              description="Your requests will show up here once you apply."
              action={
                <Button asChild size="sm">
                  <Link to="/leave-requests/apply">Apply for leave</Link>
                </Button>
              }
            />
          ) : (
            <LeaveRequestsTable requests={recentRequests} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
