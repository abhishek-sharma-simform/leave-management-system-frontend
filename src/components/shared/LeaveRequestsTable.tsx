import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { LeaveRequest } from "@/types";

/**
 * Shared by the dashboard's "recent requests" list and the full My Requests
 * page. `linkBase` lets the manager screens reuse it by pointing rows at
 * /manager/requests/:id instead of /leave-requests/:id.
 */
export function LeaveRequestsTable({
  requests,
  linkBase = "/leave-requests",
  showEmployee = false,
}: {
  requests: LeaveRequest[];
  linkBase?: string;
  showEmployee?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showEmployee && <TableHead>Employee</TableHead>}
          <TableHead>Leave type</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead className="text-right">Days</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {requests.map((request) => (
          <TableRow
            key={request.id}
            className="cursor-pointer"
            onClick={() => navigate(`${linkBase}/${request.id}`)}
          >
            {showEmployee && (
              <TableCell className="font-medium">
                {request.user?.name ?? `User #${request.userId}`}
              </TableCell>
            )}
            <TableCell>
              {request.leaveType?.name ?? `Type #${request.leaveTypeId}`}
            </TableCell>
            <TableCell>{formatDate(request.startDate)}</TableCell>
            <TableCell>{formatDate(request.endDate)}</TableCell>
            <TableCell className="text-right">
              {request.daysRequested}
            </TableCell>
            <TableCell>
              <StatusBadge status={request.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
