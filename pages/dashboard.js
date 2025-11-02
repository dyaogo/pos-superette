// pages/dashboard.js - VERSION TEST SANS ProtectedRoute
import { useApp } from "../src/contexts/AppContext";

// ✅ Forcer le SSR
export async function getServerSideProps() {
  return {
    props: {
      serverTime: new Date().toISOString(),
      buildTest: "SSR-ENABLED-" + Date.now(),
    },
  };
}

export default function DashboardPage({ serverTime, buildTest }) {
  const { salesHistory = [], productCatalog = [], customers = [] } = useApp();

  const stats = {
    totalRevenue: salesHistory.reduce(
      (sum, sale) => sum + (sale.total || 0),
      0
    ),
    totalSales: salesHistory.length,
    totalProducts: productCatalog.length,
    totalCustomers: customers.length,
  };

  return (
    <div style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Badge SSR TRÈS VISIBLE */}
      <div
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          background: "#10b981",
          color: "white",
          padding: "15px 20px",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: "700",
          zIndex: 9999,
          boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
          border: "3px solid white",
        }}
      >
        🔥 SSR ACTIF - {new Date(serverTime).toLocaleTimeString("fr-FR")}
        <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.9 }}>
          Build: {buildTest}
        </div>
      </div>

      <h1
        style={{ margin: "0 0 30px 0", fontSize: "32px", fontWeight: "bold" }}
      >
        ⚡ Dashboard TEST SSR
      </h1>

      {/* Message d'alerte TRÈS VISIBLE */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "30px",
          borderRadius: "16px",
          marginBottom: "30px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
        }}
      >
        <h2 style={{ margin: "0 0 15px 0", fontSize: "24px" }}>
          🧪 VERSION TEST - Sans ProtectedRoute
        </h2>
        <p style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
          Si vous voyez ce dashboard, c'est que le SSR fonctionne !
        </p>
        <p style={{ margin: "0", fontSize: "14px", opacity: 0.9 }}>
          Rechargez la page (F5) - l'heure en haut à droite DOIT changer !
        </p>
      </div>

      {/* Cartes statistiques */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "30px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Chiffre d'affaires
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {stats.totalRevenue.toLocaleString()} FCFA
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "white",
            padding: "30px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Nombre de ventes
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {stats.totalSales}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            color: "white",
            padding: "30px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Produits
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {stats.totalProducts}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            color: "white",
            padding: "30px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Clients
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {stats.totalCustomers}
          </div>
        </div>
      </div>

      {/* Info détaillée */}
      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "16px",
          border: "2px solid #e5e7eb",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "600" }}
        >
          📊 Détails du Rendu Serveur
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div
            style={{
              fontSize: "15px",
              padding: "15px",
              background: "#f3f4f6",
              borderRadius: "8px",
            }}
          >
            <strong>🕐 Heure du serveur :</strong>{" "}
            {new Date(serverTime).toLocaleString("fr-FR")}
          </div>
          <div
            style={{
              fontSize: "15px",
              padding: "15px",
              background: "#f3f4f6",
              borderRadius: "8px",
            }}
          >
            <strong>🆔 Build ID :</strong> {buildTest}
          </div>
          <div
            style={{
              fontSize: "15px",
              padding: "15px",
              background: "#dcfce7",
              borderRadius: "8px",
              color: "#166534",
            }}
          >
            <strong>✅ Status SSR :</strong> ACTIF - Page générée côté serveur
          </div>
          <div
            style={{
              fontSize: "15px",
              padding: "15px",
              background: "#e0f2fe",
              borderRadius: "8px",
              color: "#0c4a6e",
            }}
          >
            <strong>📈 Données :</strong> {stats.totalSales} ventes chargées
            depuis la base
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          marginTop: "30px",
          padding: "25px",
          background: "#fef3c7",
          borderLeft: "4px solid #f59e0b",
          borderRadius: "8px",
        }}
      >
        <h4
          style={{ margin: "0 0 15px 0", color: "#92400e", fontSize: "18px" }}
        >
          🧪 Test à Effectuer
        </h4>
        <ol style={{ margin: 0, paddingLeft: "20px", color: "#92400e" }}>
          <li style={{ marginBottom: "10px" }}>
            <strong>Appuyez sur F5</strong> pour recharger la page
          </li>
          <li style={{ marginBottom: "10px" }}>
            <strong>L'heure en haut à droite DOIT changer</strong> à chaque
            rechargement
          </li>
          <li style={{ marginBottom: "10px" }}>
            <strong>Le Build ID DOIT aussi changer</strong> à chaque
            rechargement
          </li>
          <li>
            Si ça change →{" "}
            <strong style={{ color: "#166534" }}>SSR fonctionne ! ✅</strong>
          </li>
        </ol>
      </div>
    </div>
  );
}
