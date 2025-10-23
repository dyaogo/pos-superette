import ProtectedRoute from "../components/ProtectedRoute";
import PermissionGate from "../components/PermissionGate";
import ReceptionModule from "../src/modules/reception/ReceptionModule";

export default function ReceptionPage() {
  return (
    <ProtectedRoute>
      <PermissionGate
        requiredPermissions={["manage_inventory"]}
        message="Vous n'avez pas accès à la réception de commandes"
      >
        <ReceptionModule />
      </PermissionGate>
    </ProtectedRoute>
  );
}
