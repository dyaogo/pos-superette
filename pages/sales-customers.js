import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../src/contexts/AuthContext";
import ModuleErrorBoundary from "../src/components/ErrorBoundary/ModuleErrorBoundary";
import dynamic from "next/dynamic";
import { FileText, Users, CreditCard, RotateCcw } from "lucide-react";

// Lazy load des modules - importer depuis les modules existants
const SalesModule = dynamic(() => import("../src/modules/sales/SalesModule"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const CustomersModule = dynamic(() => import("../src/modules/customers/CustomersModule"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const CreditsModule = dynamic(() => import("../src/modules/credits/CreditsModule"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const ReturnsModule = dynamic(() => import("../src/modules/returns/ReturnsModule"), {
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

export default function SalesCustomersPage() {
  const router = useRouter();
  const { currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState("sales");

  const tabs = [
    {
      id: "sales",
      label: "Ventes",
      icon: FileText,
      permission: "view_sales",
    },
    {
      id: "customers",
      label: "Clients",
      icon: Users,
      permission: "manage_customers",
    },
    {
      id: "credits",
      label: "Crédits",
      icon: CreditCard,
      permission: "manage_credits",
    },
    {
      id: "returns",
      label: "Retours",
      icon: RotateCcw,
      permission: "view_returns",
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
        moduleName="Ventes & Clients"
        fallbackTitle="Erreur dans le module"
        fallbackMessage="Une erreur est survenue lors du chargement du module."
        onGoHome={() => router.push("/pos")}
        onReset={() => router.reload()}
      >
        {activeTab === "sales" && <SalesModule />}
        {activeTab === "customers" && <CustomersModule />}
        {activeTab === "credits" && <CreditsModule />}
        {activeTab === "returns" && <ReturnsModule />}
      </ModuleErrorBoundary>
    </div>
  );
}
