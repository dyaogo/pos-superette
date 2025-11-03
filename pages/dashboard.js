// pages/dashboard.js - Version qui fonctionne avec _app.js mounted check
import { useEffect, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { useApp } from "../src/contexts/AppContext";

function DashboardPage() {
  const { salesHistory = [], productCatalog = [], customers = [] } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mettre à jour l'heure pour montrer que c'est dynamique
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
      {/* Badge de temps en haut à droite */}
      <div
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          background: "#10b981",
          color: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "600",
          zIndex: 9999,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        🕐 {currentTime.toLocaleTimeString("fr-FR")}
      </div>

      <h1
        style={{ margin: "0 0 30px 0", fontSize: "32px", fontWeight: "bold" }}
      >
        Tableau de bord
      </h1>

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

      {/* Informations */}
      <div
        style={{
          background: "var(--color-surface)",
          padding: "25px",
          borderRadius: "16px",
          border: "1px solid var(--color-border)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <h3
          style={{ margin: "0 0 15px 0", fontSize: "18px", fontWeight: "600" }}
        >
          État du système
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div
            style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
          >
            ✅ Application fonctionnelle en mode Client-Side
          </div>
          <div
            style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
          >
            🕐 Heure actuelle:{" "}
            <strong>{currentTime.toLocaleString("fr-FR")}</strong>
          </div>
          <div
            style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
          >
            📊 {stats.totalSales} ventes enregistrées
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPageProtected() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}

export default DashboardPageProtected;
