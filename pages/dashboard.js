import ProtectedRoute from "../components/ProtectedRoute";
import PermissionGate from "../components/PermissionGate";
import { useState, useMemo } from "react";
import { useApp } from "../src/contexts/AppContext";
import SalesChart from "../components/SalesChart";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Calendar,
  Award,
  AlertCircle,
  Download, // NOUVEAU
  FileText, // NOUVEAU
  Table, // NOUVEAU
} from "lucide-react";
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  prepareSalesData,
  prepareProductsData,
  prepareCreditsData,
} from "../utils/exportData"; // NOUVEAU

function DashboardPage() {
  const { salesHistory, productCatalog, customers, credits, loading } =
    useApp();
  const [period, setPeriod] = useState("week"); // today, week, month, year

  // Calculer les dates selon la période
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case "today":
        return { start: today, end: new Date() };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: weekStart, end: new Date() };
      case "month":
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        return { start: monthStart, end: new Date() };
      case "year":
        const yearStart = new Date(today);
        yearStart.setDate(today.getDate() - 365);
        return { start: yearStart, end: new Date() };
      default:
        return { start: today, end: new Date() };
    }
  };

  const { start, end } = getDateRange();

  // Filtrer les ventes par période
  const periodSales = useMemo(() => {
    return salesHistory.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= start && saleDate <= end;
    });
  }, [salesHistory, start, end]);

  // Statistiques globales
  const stats = useMemo(() => {
    const totalRevenue = periodSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalSales = periodSales.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    const totalStock = productCatalog.reduce((sum, p) => sum + p.stock, 0);
    const stockValue = productCatalog.reduce(
      (sum, p) => sum + p.sellingPrice * p.stock,
      0
    );
    const lowStock = productCatalog.filter((p) => p.stock < 10).length;

    const activeCredits = credits.filter((c) => c.status !== "paid");
    const totalCreditsAmount = activeCredits.reduce(
      (sum, c) => sum + c.remainingAmount,
      0
    );

    return {
      totalRevenue,
      totalSales,
      averageTicket,
      totalCustomers: customers.length,
      totalStock,
      stockValue,
      lowStock,
      totalCreditsAmount,
      activeCreditsCount: activeCredits.length,
    };
  }, [periodSales, productCatalog, customers, credits]);

  // Données pour le graphique des ventes par jour
  const salesByDay = useMemo(() => {
    const days = {};

    periodSales.forEach((sale) => {
      const date = new Date(sale.createdAt);
      const dayKey = date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      });

      if (days[dayKey]) {
        days[dayKey] += sale.total;
      } else {
        days[dayKey] = sale.total;
      }
    });

    return Object.entries(days)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([label, value]) => ({ label, value: Math.round(value) }));
  }, [periodSales]);

  // Top 5 produits les plus vendus
  const topProducts = useMemo(() => {
    const productSales = {};

    periodSales.forEach((sale) => {
      sale.items?.forEach((item) => {
        const key = item.productName || item.name;
        if (productSales[key]) {
          productSales[key].quantity += item.quantity;
          productSales[key].revenue +=
            item.total || item.quantity * item.unitPrice;
        } else {
          productSales[key] = {
            name: key,
            quantity: item.quantity,
            revenue: item.total || item.quantity * item.unitPrice,
          };
        }
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [periodSales]);

  if (loading) {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

  return (
    <div
      id="dashboard-content"
      style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}
    >
      {/* En-tête */}
      {/* En-tête pour impression PDF */}
      <div className="print-header" style={{ display: "none" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1
            style={{ fontSize: "28px", color: "#1f2937", marginBottom: "10px" }}
          >
            📊 Rapport d'Activité - Superette
          </h1>
          <div className="header-info">
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              <strong>Période:</strong>{" "}
              {period === "today"
                ? "Aujourd'hui"
                : period === "week"
                ? "7 derniers jours"
                : period === "month"
                ? "30 derniers jours"
                : "Année"}
            </p>
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              <strong>Date d'impression:</strong>{" "}
              {new Date().toLocaleString("fr-FR")}
            </p>
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              <strong>CA Total:</strong> {stats.totalRevenue.toLocaleString()}{" "}
              FCFA
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .print-header {
            display: block !important;
          }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <TrendingUp size={32} />
          Tableau de Bord & Analytics
        </h1>

        {/* Filtres de période */}
        <div style={{ display: "flex", gap: "10px" }}>
          {[
            { value: "today", label: "Aujourd'hui" },
            { value: "week", label: "7 derniers jours" },
            { value: "month", label: "30 derniers jours" },
            { value: "year", label: "Année" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: "10px 20px",
                background:
                  period === p.value
                    ? "var(--color-primary)"
                    : "var(--color-surface)",
                color:
                  period === p.value ? "white" : "var(--color-text-primary)",
                border: `2px solid ${
                  period === p.value
                    ? "var(--color-primary)"
                    : "var(--color-border)"
                }`,
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.2s",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* NOUVELLE SECTION - Boutons d'export */}
      <div
        style={{
          background: "var(--color-surface)",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div>
            <h3
              style={{
                margin: "0 0 5px 0",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              📥 Exporter les données
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "var(--color-text-secondary)",
              }}
            >
              Téléchargez vos rapports dans différents formats
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {/* Export Excel - Ventes */}
            <button
              onClick={() => {
                const data = prepareSalesData(periodSales);
                exportToExcel(data, `ventes_${period}_${Date.now()}`, "Ventes");
              }}
              style={{
                padding: "10px 16px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <Download size={18} />
              Excel - Ventes
            </button>

            {/* Export Excel - Produits */}
            <button
              onClick={() => {
                const data = prepareProductsData(productCatalog);
                exportToExcel(data, `produits_${Date.now()}`, "Produits");
              }}
              style={{
                padding: "10px 16px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <Table size={18} />
              Excel - Produits
            </button>

            {/* Export Excel - Crédits */}
            <button
              onClick={() => {
                const data = prepareCreditsData(credits, customers);
                exportToExcel(data, `credits_${Date.now()}`, "Crédits");
              }}
              style={{
                padding: "10px 16px",
                background: "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <Download size={18} />
              Excel - Crédits
            </button>

            {/* Export CSV */}
            <button
              onClick={() => {
                const data = prepareSalesData(periodSales);
                exportToCSV(data, `ventes_${period}_${Date.now()}`);
              }}
              style={{
                padding: "10px 16px",
                background: "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <FileText size={18} />
              CSV - Ventes
            </button>

            {/* Export PDF */}
            <button
              onClick={() =>
                exportToPDF(
                  "dashboard-content",
                  `rapport_${period}_${Date.now()}`
                )
              }
              style={{
                padding: "10px 16px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <FileText size={18} />
              Imprimer PDF
            </button>
          </div>
        </div>
      </div>

      {/* KPIs principaux */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* Chiffre d'affaires */}
        <div
          style={{
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            padding: "25px",
            borderRadius: "12px",
            color: "white",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <DollarSign size={24} />
            <span style={{ fontSize: "14px", opacity: 0.9 }}>
              Chiffre d'affaires
            </span>
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            {stats.totalRevenue.toLocaleString()} FCFA
          </div>
          <div style={{ fontSize: "13px", opacity: 0.8 }}>
            {stats.totalSales} ventes • Ticket moyen:{" "}
            {Math.round(stats.averageTicket).toLocaleString()} FCFA
          </div>
        </div>

        {/* Ventes */}
        <div
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            padding: "25px",
            borderRadius: "12px",
            color: "white",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <ShoppingBag size={24} />
            <span style={{ fontSize: "14px", opacity: 0.9 }}>Transactions</span>
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            {stats.totalSales}
          </div>
          <div style={{ fontSize: "13px", opacity: 0.8 }}>
            Total des ventes effectuées
          </div>
        </div>

        {/* Clients */}
        <div
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            padding: "25px",
            borderRadius: "12px",
            color: "white",
            boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <Users size={24} />
            <span style={{ fontSize: "14px", opacity: 0.9 }}>Clients</span>
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            {stats.totalCustomers}
          </div>
          <div style={{ fontSize: "13px", opacity: 0.8 }}>
            Clients enregistrés
          </div>
        </div>

        {/* Stock */}
        <div
          style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            padding: "25px",
            borderRadius: "12px",
            color: "white",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <Package size={24} />
            <span style={{ fontSize: "14px", opacity: 0.9 }}>
              Valeur du stock
            </span>
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            {Math.round(stats.stockValue).toLocaleString()} FCFA
          </div>
          <div style={{ fontSize: "13px", opacity: 0.8 }}>
            {stats.totalStock} unités • {stats.lowStock} en rupture
          </div>
        </div>
      </div>

      {/* Graphiques et analyses */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* Graphique des ventes */}
        <SalesChart data={salesByDay} title="📈 Évolution des ventes" />

        {/* Alertes et infos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Crédits en cours */}
          {stats.activeCreditsCount > 0 && (
            <div
              style={{
                background: "var(--color-surface)",
                padding: "20px",
                borderRadius: "12px",
                border: "2px solid #f59e0b",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <AlertCircle size={20} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
                  Crédits en cours
                </h3>
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#f59e0b",
                  marginBottom: "5px",
                }}
              >
                {stats.totalCreditsAmount.toLocaleString()} FCFA
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                }}
              >
                {stats.activeCreditsCount} crédits actifs
              </div>
            </div>
          )}

          {/* Stock faible */}
          {stats.lowStock > 0 && (
            <div
              style={{
                background: "var(--color-surface)",
                padding: "20px",
                borderRadius: "12px",
                border: "2px solid #ef4444",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <AlertCircle size={20} color="#ef4444" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
                  Alerte stock
                </h3>
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#ef4444",
                  marginBottom: "5px",
                }}
              >
                {stats.lowStock} produits
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                }}
              >
                En rupture ou stock faible
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top produits */}
      <div
        style={{
          background: "var(--color-surface)",
          padding: "25px",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
        }}
      >
        <h3
          style={{
            margin: "0 0 20px 0",
            fontSize: "18px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Award size={24} color="#f59e0b" />
          Top 5 des produits les plus vendus
        </h3>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Rang
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Produit
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Quantité vendue
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Chiffre d'affaires
              </th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((product, index) => (
              <tr
                key={product.name}
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <td style={{ padding: "15px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background:
                        index === 0
                          ? "#f59e0b"
                          : index === 1
                          ? "#9ca3af"
                          : index === 2
                          ? "#cd7f32"
                          : "var(--color-surface-hover)",
                      color: index < 3 ? "white" : "var(--color-text-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    {index + 1}
                  </span>
                </td>
                <td style={{ padding: "15px", fontWeight: "500" }}>
                  {product.name}
                </td>
                <td
                  style={{
                    padding: "15px",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "var(--color-primary)",
                  }}
                >
                  {product.quantity} unités
                </td>
                <td
                  style={{
                    padding: "15px",
                    textAlign: "right",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  {Math.round(product.revenue).toLocaleString()} FCFA
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* NOUVELLE SECTION - Analyses Avancées */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        {/* Marges bénéficiaires */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            💰 Marges Bénéficiaires
          </h3>

          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#10b981",
              marginBottom: "10px",
            }}
          >
            {(() => {
              const totalProfit = periodSales.reduce((sum, sale) => {
                return (
                  sum +
                  (sale.items?.reduce((itemSum, item) => {
                    const product = productCatalog.find(
                      (p) => p.id === item.productId
                    );
                    if (product) {
                      const profit =
                        (item.unitPrice - product.costPrice) * item.quantity;
                      return itemSum + profit;
                    }
                    return itemSum;
                  }, 0) || 0)
                );
              }, 0);
              return Math.round(totalProfit).toLocaleString();
            })()}{" "}
            FCFA
          </div>

          <div
            style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
          >
            Profit total sur la période
          </div>

          <div
            style={{
              marginTop: "15px",
              padding: "10px",
              background: "var(--color-bg)",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-muted)",
                marginBottom: "5px",
              }}
            >
              Marge moyenne
            </div>
            <div
              style={{ fontSize: "20px", fontWeight: "bold", color: "#10b981" }}
            >
              {(() => {
                const totalRevenue = stats.totalRevenue;
                const totalProfit = periodSales.reduce((sum, sale) => {
                  return (
                    sum +
                    (sale.items?.reduce((itemSum, item) => {
                      const product = productCatalog.find(
                        (p) => p.id === item.productId
                      );
                      if (product) {
                        const profit =
                          (item.unitPrice - product.costPrice) * item.quantity;
                        return itemSum + profit;
                      }
                      return itemSum;
                    }, 0) || 0)
                  );
                }, 0);
                const marginPercent =
                  totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
                return marginPercent.toFixed(1);
              })()}
              %
            </div>
          </div>
        </div>

        {/* Rotation des stocks */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            🔄 Rotation des Stocks
          </h3>

          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#3b82f6",
              marginBottom: "10px",
            }}
          >
            {(() => {
              const totalSold = periodSales.reduce((sum, sale) => {
                return (
                  sum +
                  (sale.items?.reduce(
                    (itemSum, item) => itemSum + item.quantity,
                    0
                  ) || 0)
                );
              }, 0);
              const avgStock = stats.totalStock;
              const daysInPeriod = Math.max(
                1,
                Math.ceil((end - start) / (1000 * 60 * 60 * 24))
              );
              const turnover =
                avgStock > 0
                  ? (totalSold / avgStock) * (365 / daysInPeriod)
                  : 0;
              return turnover.toFixed(1);
            })()}
            x
          </div>

          <div
            style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
          >
            Fois par an (estimé)
          </div>

          <div
            style={{
              marginTop: "15px",
              padding: "10px",
              background: "var(--color-bg)",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-muted)",
                marginBottom: "5px",
              }}
            >
              Unités vendues / période
            </div>
            <div
              style={{ fontSize: "20px", fontWeight: "bold", color: "#3b82f6" }}
            >
              {periodSales.reduce((sum, sale) => {
                return (
                  sum +
                  (sale.items?.reduce(
                    (itemSum, item) => itemSum + item.quantity,
                    0
                  ) || 0)
                );
              }, 0)}{" "}
              unités
            </div>
          </div>
        </div>

        {/* Analyse par catégorie */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            📂 Performance par Catégorie
          </h3>

          {(() => {
            const categorySales = {};

            periodSales.forEach((sale) => {
              sale.items?.forEach((item) => {
                const product = productCatalog.find(
                  (p) => p.id === item.productId
                );
                const category = product?.category || "Autre";

                if (categorySales[category]) {
                  categorySales[category] +=
                    item.total || item.quantity * item.unitPrice;
                } else {
                  categorySales[category] =
                    item.total || item.quantity * item.unitPrice;
                }
              });
            });

            const topCategory = Object.entries(categorySales).sort(
              (a, b) => b[1] - a[1]
            )[0];

            return (
              <>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#8b5cf6",
                    marginBottom: "10px",
                  }}
                >
                  {topCategory ? topCategory[0] : "N/A"}
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--color-text-secondary)",
                    marginBottom: "15px",
                  }}
                >
                  Catégorie la plus performante
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {Object.entries(categorySales)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([cat, amount]) => (
                      <div
                        key={cat}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {cat}
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: "600" }}>
                          {Math.round(amount).toLocaleString()} F
                        </span>
                      </div>
                    ))}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Produits les plus rentables */}
      <div
        style={{
          background: "var(--color-surface)",
          padding: "25px",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          marginTop: "30px",
        }}
      >
        <h3
          style={{
            margin: "0 0 20px 0",
            fontSize: "18px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          💎 Top 5 des produits les plus rentables
        </h3>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Produit
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Marge unitaire
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Quantité vendue
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Profit total
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Marge %
              </th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const productProfits = {};

              periodSales.forEach((sale) => {
                sale.items?.forEach((item) => {
                  const product = productCatalog.find(
                    (p) => p.id === item.productId
                  );
                  if (product) {
                    const unitMargin = item.unitPrice - product.costPrice;
                    const totalProfit = unitMargin * item.quantity;
                    const marginPercent = (unitMargin / item.unitPrice) * 100;

                    if (productProfits[product.id]) {
                      productProfits[product.id].quantity += item.quantity;
                      productProfits[product.id].totalProfit += totalProfit;
                    } else {
                      productProfits[product.id] = {
                        name: product.name,
                        unitMargin,
                        quantity: item.quantity,
                        totalProfit,
                        marginPercent,
                      };
                    }
                  }
                });
              });

              return Object.values(productProfits)
                .sort((a, b) => b.totalProfit - a.totalProfit)
                .slice(0, 5)
                .map((product, index) => (
                  <tr
                    key={index}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td style={{ padding: "15px", fontWeight: "500" }}>
                      {product.name}
                    </td>
                    <td
                      style={{
                        padding: "15px",
                        textAlign: "right",
                        color: "#10b981",
                        fontWeight: "600",
                      }}
                    >
                      {Math.round(product.unitMargin).toLocaleString()} FCFA
                    </td>
                    <td style={{ padding: "15px", textAlign: "right" }}>
                      {product.quantity} unités
                    </td>
                    <td
                      style={{
                        padding: "15px",
                        textAlign: "right",
                        fontWeight: "bold",
                        fontSize: "16px",
                        color: "#10b981",
                      }}
                    >
                      {Math.round(product.totalProfit).toLocaleString()} FCFA
                    </td>
                    <td style={{ padding: "15px", textAlign: "right" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          background:
                            product.marginPercent > 30
                              ? "#d1fae5"
                              : product.marginPercent > 20
                              ? "#fef3c7"
                              : "#fee2e2",
                          color:
                            product.marginPercent > 30
                              ? "#065f46"
                              : product.marginPercent > 20
                              ? "#92400e"
                              : "#991b1b",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      >
                        {product.marginPercent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ));
            })()}
          </tbody>
        </table>
      </div>

      {/* Heures de pointe */}
      <div
        style={{
          background: "var(--color-surface)",
          padding: "25px",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          marginTop: "30px",
        }}
      >
        <h3
          style={{
            margin: "0 0 20px 0",
            fontSize: "18px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          ⏰ Heures de Pointe
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
            gap: "10px",
          }}
        >
          {(() => {
            const hoursSales = {};

            periodSales.forEach((sale) => {
              const hour = new Date(sale.createdAt).getHours();
              hoursSales[hour] = (hoursSales[hour] || 0) + 1;
            });

            const maxSales = Math.max(...Object.values(hoursSales), 1);

            return Array.from({ length: 24 }, (_, hour) => {
              const sales = hoursSales[hour] || 0;
              const intensity = sales / maxSales;

              return (
                <div
                  key={hour}
                  style={{
                    padding: "10px",
                    background:
                      sales > 0
                        ? `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`
                        : "var(--color-bg)",
                    borderRadius: "8px",
                    textAlign: "center",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color:
                        intensity > 0.5 ? "white" : "var(--color-text-primary)",
                      marginBottom: "4px",
                    }}
                  >
                    {hour}h
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: intensity > 0.5 ? "white" : "var(--color-primary)",
                    }}
                  >
                    {sales}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            background: "var(--color-bg)",
            borderRadius: "8px",
            fontSize: "13px",
            color: "var(--color-text-secondary)",
            textAlign: "center",
          }}
        >
          💡 Plus la case est foncée, plus l'activité est élevée à cette heure
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
