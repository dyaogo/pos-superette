import ProtectedRoute from "../components/ProtectedRoute";
import PermissionGate from "../components/PermissionGate"; // ✨ AJOUTÉ
import { useState, useMemo } from "react";
import { useApp } from "../src/contexts/AppContext";
import { useAuth } from "../src/contexts/AuthContext"; // ✨ AJOUTÉ
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
  Download,
  FileText,
  Table,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  prepareSalesData,
  prepareProductsData,
  prepareCreditsData,
} from "../utils/exportData";

function DashboardPage() {
  const { salesHistory, productCatalog, customers, credits, loading } =
    useApp();
  const { currentUser, hasRole } = useAuth(); // ✨ AJOUTÉ
  const [period, setPeriod] = useState("week");

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

  const periodSales = useMemo(() => {
    return salesHistory.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= start && saleDate <= end;
    });
  }, [salesHistory, start, end]);

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
              {new Date().toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <div>
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
            Tableau de bord
          </h1>
          <p
            style={{
              margin: "5px 0 0 0",
              color: "var(--color-text-secondary)",
            }}
          >
            Vue d'ensemble de votre activité
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{
              padding: "10px 15px",
              border: "2px solid var(--color-border)",
              borderRadius: "8px",
              background: "var(--color-surface)",
              color: "var(--color-text-primary)",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="year">Année</option>
          </select>
        </div>
      </div>

      {/* Cartes statistiques principales */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* Chiffre d'affaires - Visible par tous */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DollarSign size={24} color="white" />
            </div>
            <div>
              <div
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "14px",
                }}
              >
                Chiffre d'affaires
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#3b82f6",
                }}
              >
                {stats.totalRevenue.toLocaleString()} FCFA
              </div>
            </div>
          </div>
        </div>

        {/* Nombre de ventes - Visible par tous */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingBag size={24} color="white" />
            </div>
            <div>
              <div
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "14px",
                }}
              >
                Nombre de ventes
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#10b981",
                }}
              >
                {stats.totalSales}
              </div>
            </div>
          </div>
        </div>

        {/* Ticket moyen - Visible par tous */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Award size={24} color="white" />
            </div>
            <div>
              <div
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "14px",
                }}
              >
                Ticket moyen
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#f59e0b",
                }}
              >
                {Math.round(stats.averageTicket).toLocaleString()} FCFA
              </div>
            </div>
          </div>
        </div>

        {/* Clients - Visible par tous */}
        <div
          style={{
            background: "var(--color-surface)",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={24} color="white" />
            </div>
            <div>
              <div
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "14px",
                }}
              >
                Clients
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#8b5cf6",
                }}
              >
                {stats.totalCustomers}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✨ Section Profit - Visible seulement pour Admin et Manager */}
      <PermissionGate roles={["admin", "manager"]}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
            padding: "20px",
            background:
              "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 95, 70, 0.05))",
            borderRadius: "12px",
            border: "2px solid rgba(16, 185, 129, 0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
            >
              <Eye size={28} color="white" />
            </div>
            <div>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                  fontWeight: "600",
                  marginBottom: "5px",
                }}
              >
                💰 Profit total
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#10b981",
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
                            (item.unitPrice - product.costPrice) *
                            item.quantity;
                          return itemSum + profit;
                        }
                        return itemSum;
                      }, 0) || 0)
                    );
                  }, 0);
                  return totalProfit.toLocaleString();
                })()}{" "}
                FCFA
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
              }}
            >
              <TrendingUp size={28} color="white" />
            </div>
            <div>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                  fontWeight: "600",
                  marginBottom: "5px",
                }}
              >
                📊 Marge moyenne
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#8b5cf6",
                }}
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
                            (item.unitPrice - product.costPrice) *
                            item.quantity;
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
        </div>
      </PermissionGate>

      {/* Graphique des ventes */}
      <div style={{ marginBottom: "30px" }}>
        <SalesChart data={salesByDay} />
      </div>

      {/* Section inférieure - 2 colonnes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* Top 5 produits */}
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
            <Award size={20} />
            Top 5 Produits
          </h3>

          {topProducts.length === 0 ? (
            <p
              style={{
                color: "var(--color-text-secondary)",
                textAlign: "center",
              }}
            >
              Aucune vente sur cette période
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  style={{
                    padding: "15px",
                    background: "var(--color-bg)",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background:
                          index === 0
                            ? "linear-gradient(135deg, #f59e0b, #d97706)"
                            : index === 1
                            ? "linear-gradient(135deg, #94a3b8, #64748b)"
                            : index === 2
                            ? "linear-gradient(135deg, #cd7f32, #b8732d)"
                            : "var(--color-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: "600" }}>{product.name}</div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {product.quantity} vendus
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "bold", color: "#10b981" }}>
                      {product.revenue.toLocaleString()} FCFA
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock & Alertes */}
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
            <Package size={20} />
            Inventaire
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <div
              style={{
                padding: "15px",
                background: "var(--color-bg)",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                  marginBottom: "5px",
                }}
              >
                Total produits
              </div>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                {stats.totalStock} unités
              </div>
            </div>

            <div
              style={{
                padding: "15px",
                background: "var(--color-bg)",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                  marginBottom: "5px",
                }}
              >
                Valeur du stock
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#3b82f6",
                }}
              >
                {stats.stockValue.toLocaleString()} FCFA
              </div>
            </div>

            {stats.lowStock > 0 && (
              <div
                style={{
                  padding: "15px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "2px solid #ef4444",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <AlertCircle size={24} color="#ef4444" />
                <div>
                  <div style={{ fontWeight: "600", color: "#ef4444" }}>
                    {stats.lowStock} produit(s) en stock faible
                  </div>
                  <div style={{ fontSize: "13px", color: "#991b1b" }}>
                    Réapprovisionnement nécessaire
                  </div>
                </div>
              </div>
            )}

            {stats.activeCreditsCount > 0 && (
              <div
                style={{
                  padding: "15px",
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "2px solid #f59e0b",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    color: "#d97706",
                    marginBottom: "5px",
                    fontWeight: "600",
                  }}
                >
                  Crédits actifs
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#f59e0b",
                  }}
                >
                  {stats.totalCreditsAmount.toLocaleString()} FCFA
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#d97706",
                    marginTop: "5px",
                  }}
                >
                  {stats.activeCreditsCount} client(s)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✨ Tableau des profits par produit - Visible seulement pour Admin et Manager */}
      <PermissionGate roles={["admin", "manager"]}>
        <div
          style={{
            background: "var(--color-surface)",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
            marginBottom: "30px",
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
            <Eye size={20} color="#10b981" />
            Analyse de Rentabilité par Produit
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "var(--color-bg)",
                    borderBottom: "2px solid var(--color-border)",
                  }}
                >
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
                        const marginPercent =
                          (unitMargin / item.unitPrice) * 100;

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
                    .slice(0, 10)
                    .map((product) => (
                      <tr
                        key={product.name}
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        <td style={{ padding: "12px", fontWeight: "500" }}>
                          {product.name}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {product.quantity}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            fontWeight: "600",
                            color: "#3b82f6",
                          }}
                        >
                          {product.unitMargin.toLocaleString()} FCFA
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            fontWeight: "bold",
                            color: "#10b981",
                          }}
                        >
                          {product.totalProfit.toLocaleString()} FCFA
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            fontWeight: "600",
                          }}
                        >
                          <span
                            style={{
                              padding: "4px 12px",
                              borderRadius: "12px",
                              background:
                                product.marginPercent > 30
                                  ? "#dcfce7"
                                  : product.marginPercent > 15
                                  ? "#fef3c7"
                                  : "#fee2e2",
                              color:
                                product.marginPercent > 30
                                  ? "#166534"
                                  : product.marginPercent > 15
                                  ? "#92400e"
                                  : "#991b1b",
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
        </div>
      </PermissionGate>
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
