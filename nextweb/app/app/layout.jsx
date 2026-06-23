import { ProtectedRoute } from "../../src/app/components/ProtectedRoute";
import { DashboardLayout } from "../../src/app/layouts/DashboardLayout";

export default function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
