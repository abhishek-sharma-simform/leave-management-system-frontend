import { CheckCircle2, XCircle } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import type { LeaveDecision } from "@/types";

/**
 * Renders the `history` array from GET /leave-requests/:id/history. A pending
 * request simply has none yet.
 */
export function DecisionHistory({
  decisions,
}: {
  decisions: LeaveDecision[];
}) {
  if (decisions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No decisions yet — this request is still awaiting a manager.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {decisions.map((decision) => {
        const isApproval = decision.action === "APPROVED";
        const Icon = isApproval ? CheckCircle2 : XCircle;

        return (
          <li key={decision.id} className="flex gap-3">
            <Icon
              className={
                isApproval
                  ? "mt-0.5 size-5 shrink-0 text-emerald-600"
                  : "mt-0.5 size-5 shrink-0 text-red-600"
              }
            />
            <div className="space-y-0.5 text-sm">
              <p className="font-medium">
                {isApproval ? "Approved" : "Rejected"} by{" "}
                {decision.actor?.name ?? "a manager"}
              </p>
              <p className="text-muted-foreground">
                {formatDateTime(decision.decidedAt)}
              </p>
              {decision.reason && (
                <p className="text-muted-foreground">
                  Reason: {decision.reason}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
