// pages/dashboard.js
import ProtectedRoute from "../components/ProtectedRoute";
import DashboardModule from "../src/modules/dashboard/DashboardModule";

function DashboardPage() {
  return <DashboardModule />;
}

function DashboardPageProtected() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}

export default DashboardPageProtected;
