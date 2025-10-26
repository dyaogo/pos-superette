import { useEffect, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import PermissionGate from "../components/PermissionGate";
import dynamic from "next/dynamic";

// Import dynamique pour éviter les erreurs SSR
const ReceptionModule = dynamic(
  () => import("../src/modules/reception/ReceptionModule"),
  { ssr: false }
);

export default function ReceptionPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #e5e7eb",
            borderTop: "4px solid #3b82f6",
            borderRadius: "50%",
            margin: "0 auto",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ marginTop: "20px", color: "#6b7280" }}>Chargement...</p>
      </div>
    );
  }

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
