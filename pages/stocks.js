import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../src/contexts/AuthContext";
import ModuleErrorBoundary from "../src/components/ErrorBoundary/ModuleErrorBoundary";
import dynamic from "next/dynamic";
import { Package, ClipboardList, PackagePlus, ArrowRightLeft } from "lucide-react";

// Lazy load des modules de stock
const InventoryModule = dynamic(() => import("../src/modules/inventory/InventoryModule"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const PhysicalInventoryModule = dynamic(
  () => import("../src/modules/inventory/PhysicalInventoryModule"),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

const ReceptionModule = dynamic(() => import("../src/modules/inventory/ReceptionModule"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const TransferModule = dynamic(() => import("../src/modules/inventory/TransferModule"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

function LoadingSpinner() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "400px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "50px",
            height: "50px",
            border: "5px solid var(--color-border)",
            borderTopColor: "var(--color-primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px",
          }}
        />
        <p style={{ color: "var(--color-text-secondary)" }}>Chargement...</p>
      </div>
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function StocksPage() {
  const router = useRouter();
  const { currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState("inventory");

  const tabs = [
    {
      id: "inventory",
      label: "Inventaire",
      icon: Package,
      permission: "manage_inventory",
    },
    {
      id: "physical",
      label: "Inventaire Physique",
      icon: ClipboardList,
      permission: "manage_inventory",
    },
    {
      id: "reception",
      label: "Réceptions",
      icon: PackagePlus,
      permission: "manage_inventory",
    },
    {
      id: "transfers",
      label: "Transferts",
      icon: ArrowRightLeft,
      permission: "manage_transfers",
    },
  ];

  // Filtrer les onglets selon les permissions
  const visibleTabs = tabs.filter(
    (tab) => !tab.permission || hasPermission(tab.permission)
  );

  if (!currentUser) {
    return null;
  }

  return (
    <div style={{ padding: "20px 30px" }}>
      {/* Onglets */}
      <div
        style={{
          borderBottom: "2px solid var(--color-border)",
          marginBottom: "30px",
        }}
      >
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "12px 24px",
                  background: isActive
                    ? "var(--color-primary)"
                    : "transparent",
                  color: isActive ? "white" : "var(--color-text-primary)",
                  border: "none",
                  borderBottom: isActive
                    ? "3px solid var(--color-primary)"
                    : "3px solid transparent",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: isActive ? "600" : "500",
                  transition: "all 0.2s",
                  borderRadius: "8px 8px 0 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background =
                      "var(--color-surface-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu des onglets */}
      <ModuleErrorBoundary
        moduleName="Stocks"
        fallbackTitle="Erreur dans le module"
        fallbackMessage="Une erreur est survenue lors du chargement du module."
        onGoHome={() => router.push("/pos")}
        onReset={() => router.reload()}
      >
        {activeTab === "inventory" && <InventoryModule />}
        {activeTab === "physical" && <PhysicalInventoryModule />}
        {activeTab === "reception" && <ReceptionModule />}
        {activeTab === "transfers" && <TransferModule />}
      </ModuleErrorBoundary>
    </div>
  );
}
