import { useOnline } from "../src/contexts/OnlineContext";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function OnlineStatusBadge() {
  const { isOnline, isSyncing, pendingCount, syncPendingData } = useOnline();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      {/* Badge de statut */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "16px",
          background: isOnline
            ? "linear-gradient(135deg, #10b981, #059669)"
            : "linear-gradient(135deg, #ef4444, #dc2626)",
          color: "white",
          fontSize: "12px",
          fontWeight: "600",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {isOnline ? (
          <>
            <Wifi size={14} />
            En ligne
          </>
        ) : (
          <>
            <WifiOff size={14} />
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
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            color: "white",
            fontSize: "11px",
            fontWeight: "600",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          <RefreshCw
            size={14}
            style={{ animation: "spin 1s linear infinite" }}
          />
          Sync...
        </div>
      )}

      {/* Compteur d'éléments en attente - Visible même en ligne */}
      {pendingCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            borderRadius: "12px",
            background: isOnline
              ? "linear-gradient(135deg, #3b82f6, #2563eb)"
              : "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "white",
            fontSize: "11px",
            fontWeight: "600",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        >
          {pendingCount}
        </div>
      )}

      {/* Bouton de synchronisation manuelle */}
      {isOnline && pendingCount > 0 && !isSyncing && (
        <button
          onClick={syncPendingData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 10px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            color: "white",
            fontSize: "11px",
            fontWeight: "600",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            transition: "transform 0.2s",
            touchAction: "manipulation",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          title={`Synchroniser ${pendingCount} élément(s)`}
        >
          <RefreshCw size={12} />
        </button>
      )}

      <style jsx>{`
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
