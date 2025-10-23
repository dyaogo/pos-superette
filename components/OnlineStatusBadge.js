import { useOnline } from "../src/contexts/OnlineContext";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function OnlineStatusBadge() {
  const { isOnline, isSyncing, pendingCount, syncPendingData } = useOnline();

  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
        right: "20px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        alignItems: "flex-end",
      }}
    >
      {/* Badge de statut */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          borderRadius: "20px",
          background: isOnline
            ? "linear-gradient(135deg, #10b981, #059669)"
            : "linear-gradient(135deg, #ef4444, #dc2626)",
          color: "white",
          fontSize: "14px",
          fontWeight: "600",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          animation: "slideIn 0.3s ease-out",
        }}
      >
        {isOnline ? (
          <>
            <Wifi size={18} />
            En ligne
          </>
        ) : (
          <>
            <WifiOff size={18} />
            Hors ligne
          </>
        )}
      </div>

      {/* Indicateur de synchronisation */}
      {isSyncing && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            color: "white",
            fontSize: "13px",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          <RefreshCw
            size={16}
            style={{ animation: "spin 1s linear infinite" }}
          />
          Synchronisation...
        </div>
      )}

      {/* Compteur d'éléments en attente - Visible même en ligne */}
      {pendingCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "20px",
            background: isOnline
              ? "linear-gradient(135deg, #3b82f6, #2563eb)"
              : "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "white",
            fontSize: "13px",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        >
          📊 {pendingCount} en attente
        </div>
      )}

      {/* Bouton de synchronisation manuelle */}
      {isOnline && pendingCount > 0 && !isSyncing && (
        <button
          onClick={syncPendingData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            color: "white",
            fontSize: "13px",
            fontWeight: "600",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <RefreshCw size={16} />
          Synchroniser ({pendingCount})
        </button>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
