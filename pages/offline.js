import { WifiOff, RefreshCw } from "lucide-react";
import { useRouter } from "next/router";

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    if (navigator.onLine) {
      router.reload();
    } else {
      alert("Toujours hors ligne. Veuillez vérifier votre connexion.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          background: "white",
          borderRadius: "20px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            width: "100px",
            height: "100px",
            margin: "0 auto 30px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "bounce 2s infinite",
          }}
        >
          <WifiOff size={50} color="white" />
        </div>

        <h1
          style={{
            margin: "0 0 20px 0",
            fontSize: "32px",
            fontWeight: "bold",
            color: "#1f2937",
          }}
        >
          Vous êtes hors ligne
        </h1>

        <p
          style={{
            margin: "0 0 30px 0",
            fontSize: "16px",
            color: "#6b7280",
            lineHeight: "1.6",
          }}
        >
          Pas de panique ! L'application fonctionne en mode hors ligne. Vos
          ventes sont enregistrées localement et seront synchronisées
          automatiquement dès que la connexion sera rétablie.
        </p>

        <div
          style={{
            background: "#f3f4f6",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "30px",
            textAlign: "left",
          }}
        >
          <h3
            style={{
              margin: "0 0 15px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#374151",
            }}
          >
            ✅ Fonctionnalités disponibles hors ligne :
          </h3>
          <ul
            style={{
              margin: 0,
              padding: "0 0 0 20px",
              color: "#6b7280",
              fontSize: "14px",
              lineHeight: "2",
            }}
          >
            <li>Enregistrer des ventes</li>
            <li>Consulter les produits</li>
            <li>Voir les clients</li>
            <li>Gérer les crédits</li>
            <li>Consulter l'historique local</li>
          </ul>
        </div>

        <button
          onClick={handleRetry}
          style={{
            width: "100%",
            padding: "15px",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <RefreshCw size={20} />
          Réessayer la connexion
        </button>

        <p
          style={{
            marginTop: "20px",
            fontSize: "13px",
            color: "#9ca3af",
          }}
        >
          L'application vérifie automatiquement la connexion
        </p>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}
