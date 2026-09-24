import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ManagerRoute } from "@/components/layout/ManagerRoute";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginPage } from "@/features/auth/LoginPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { BalancePage } from "@/features/leave-balances/BalancePage";
import { ApplyLeavePage } from "@/features/leave-requests/ApplyLeavePage";
import { MyRequestsPage } from "@/features/leave-requests/MyRequestsPage";
import { RequestDetailPage } from "@/features/leave-requests/RequestDetailPage";
import { AuditTrailPage } from "@/features/manager/AuditTrailPage";
import { ManagerRequestDetailPage } from "@/features/manager/ManagerRequestDetailPage";
import { PendingRequestsPage } from "@/features/manager/PendingRequestsPage";
import { TeamCalendarPage } from "@/features/manager/TeamCalendarPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Everything below requires a session, mirroring authMiddleware. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/leave-requests/apply" element={<ApplyLeavePage />} />
          <Route path="/leave-requests/me" element={<MyRequestsPage />} />
          <Route path="/leave-requests/:id" element={<RequestDetailPage />} />

          <Route path="/leave-balances" element={<BalancePage />} />

          {/* Every employee's team calendar: a manager's own reports, or an
              employee's own teammates — the backend picks the team based on
              role, so no role guard is needed here. */}
          <Route path="/calendar" element={<TeamCalendarPage />} />

          {/* MANAGER-only, mirroring requireRole("MANAGER"). */}
          <Route element={<ManagerRoute />}>
            <Route path="/manager/requests" element={<PendingRequestsPage />} />
            <Route
              path="/manager/requests/:id"
              element={<ManagerRequestDetailPage />}
            />
            <Route path="/manager/decisions" element={<AuditTrailPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
