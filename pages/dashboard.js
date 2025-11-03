// pages/dashboard.js - Dashboard Complet avec toutes les fonctionnalités
import { useEffect, useState, useMemo } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { useApp } from "../src/contexts/AppContext";
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Award,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

function DashboardPage() {
  const {
    salesHistory = [],
    productCatalog = [],
    customers = [],
    allProducts = [],
    allSales = [],
  } = useApp();

  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [loading, setLoading] = useState(false);

  // Fonction pour formater les nombres
  const formatNumber = (number) => {
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + "M";
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + "K";
    }
    return Math.round(number).toString();
  };

  // Calcul des métriques pour la période sélectionnée
  const getMetricsForPeriod = useMemo(() => {
    const now = new Date();
    let startDate, endDate;

    switch (selectedPeriod) {
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
    }

    const periodSales = salesHistory.filter((sale) => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    const revenue = periodSales.reduce(
      (sum, sale) => sum + (sale.total || 0),
      0
    );
    const transactions = periodSales.length;
    const avgBasket = transactions > 0 ? revenue / transactions : 0;
    const grossMargin = revenue * 0.37; // 37% de marge

    return { revenue, transactions, avgBasket, grossMargin };
  }, [salesHistory, selectedPeriod]);

  // Calcul des tendances (vs période précédente)
  const calculateTrends = useMemo(() => {
    const getPreviousPeriodSales = () => {
      const now = new Date();
      let startDate, endDate;

      switch (selectedPeriod) {
        case "today":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setDate(now.getDate() - 1);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "week":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 14);
          endDate = new Date(now);
          endDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case "year":
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31);
          break;
        default:
          return { revenue: 0, transactions: 0, avgBasket: 0, grossMargin: 0 };
      }

      const prevSales = salesHistory.filter((sale) => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
      });

      const revenue = prevSales.reduce(
        (sum, sale) => sum + (sale.total || 0),
        0
      );
      const transactions = prevSales.length;
      const avgBasket = transactions > 0 ? revenue / transactions : 0;
      const grossMargin = revenue * 0.37;

      return { revenue, transactions, avgBasket, grossMargin };
    };

    const previous = getPreviousPeriodSales();
    const current = getMetricsForPeriod;

    const calculateTrend = (currentValue, previousValue) => {
      if (previousValue === 0) return currentValue > 0 ? 100 : 0;
      return ((currentValue - previousValue) / previousValue) * 100;
    };

    return {
      revenue: calculateTrend(current.revenue, previous.revenue),
      transactions: calculateTrend(current.transactions, previous.transactions),
      basket: calculateTrend(current.avgBasket, previous.avgBasket),
      margin: calculateTrend(current.grossMargin, previous.grossMargin),
    };
  }, [getMetricsForPeriod, salesHistory, selectedPeriod]);

  // Top produits vendus
  const topProducts = useMemo(() => {
    const productSales = {};

    salesHistory.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            id: item.id,
            name: item.name,
            sales: 0,
            revenue: 0,
          };
        }
        productSales[item.id].sales += item.quantity || 0;
        productSales[item.id].revenue +=
          (item.price || 0) * (item.quantity || 0);
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [salesHistory]);

  // Ventes récentes
  const recentSales = useMemo(() => {
    return [...salesHistory]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [salesHistory]);

  // Produits en stock faible
  const lowStockProducts = useMemo(() => {
    return productCatalog.filter((p) => p.stock <= (p.minStock || 5));
  }, [productCatalog]);

  // Composant StatCard
  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color,
    delay = 0,
    marginPercentage,
  }) => (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        animation: `fadeInUp 0.6s ease ${delay}ms both`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "14px",
              color: "#64748b",
              marginBottom: "8px",
              fontWeight: "500",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#1e293b",
              marginBottom: "8px",
            }}
          >
            {value}
          </div>
          {marginPercentage && (
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Marge: {marginPercentage}%
            </div>
          )}
        </div>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "12px",
            background: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={28} color={color} />
        </div>
      </div>
      {trend !== undefined && (
        <div
          style={{
            marginTop: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: "500",
          }}
        >
          {trend >= 0 ? (
            <>
              <ArrowUp size={16} color="#10b981" />
              <span style={{ color: "#10b981" }}>+{trend.toFixed(1)}%</span>
            </>
          ) : (
            <>
              <ArrowDown size={16} color="#ef4444" />
              <span style={{ color: "#ef4444" }}>{trend.toFixed(1)}%</span>
            </>
          )}
          <span style={{ color: "#64748b" }}>vs période précédente</span>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header avec filtres de période */}
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
        <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "bold" }}>
          Tableau de bord
        </h1>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {["today", "week", "month", "year"].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              style={{
                padding: "10px 20px",
                background: selectedPeriod === period ? "#3b82f6" : "#f1f5f9",
                color: selectedPeriod === period ? "white" : "#64748b",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s",
              }}
            >
              {period === "today" && "Aujourd'hui"}
              {period === "week" && "Semaine"}
              {period === "month" && "Mois"}
              {period === "year" && "Année"}
            </button>
          ))}
        </div>
      </div>

      {/* Cartes statistiques */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        <StatCard
          title="Chiffre d'Affaires"
          value={`${formatNumber(getMetricsForPeriod.revenue)} FCFA`}
          icon={DollarSign}
          trend={calculateTrends.revenue}
          color="#10b981"
          delay={0}
        />

        <StatCard
          title="Marge Brute"
          value={`${formatNumber(getMetricsForPeriod.grossMargin)} FCFA`}
          icon={TrendingUp}
          trend={calculateTrends.margin}
          color="#8b5cf6"
          delay={100}
          marginPercentage={
            getMetricsForPeriod.revenue > 0
              ? (
                  (getMetricsForPeriod.grossMargin /
                    getMetricsForPeriod.revenue) *
                  100
                ).toFixed(1)
              : 0
          }
        />

        <StatCard
          title="Transactions"
          value={formatNumber(getMetricsForPeriod.transactions)}
          icon={ShoppingCart}
          trend={calculateTrends.transactions}
          color="#3b82f6"
          delay={200}
        />

        <StatCard
          title="Panier Moyen"
          value={`${formatNumber(
            Math.round(getMetricsForPeriod.avgBasket)
          )} FCFA`}
          icon={Award}
          trend={calculateTrends.basket}
          color="#f59e0b"
          delay={300}
        />
      </div>

      {/* Alertes stock faible */}
      {lowStockProducts.length > 0 && (
        <div
          style={{
            marginBottom: "32px",
            background: "linear-gradient(135deg, #fef3c7, #fed7af)",
            borderRadius: "16px",
            padding: "20px 24px",
            border: "1px solid #f59e0b",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <AlertTriangle size={24} color="#d97706" />
          <div>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#92400e",
                margin: "0 0 4px 0",
              }}
            >
              Attention : Stock Faible
            </h4>
            <p
              style={{
                fontSize: "14px",
                color: "#d97706",
                margin: 0,
              }}
            >
              {lowStockProducts.length} produit(s) nécessitent un
              réapprovisionnement
            </p>
          </div>
        </div>
      )}

      {/* Section ventes récentes et top produits */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {/* Ventes récentes */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#1a202c",
              margin: "0 0 20px 0",
            }}
          >
            Ventes Récentes
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {recentSales.length > 0 ? (
              recentSales.map((sale, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1a202c",
                        marginBottom: "4px",
                      }}
                    >
                      Vente #{sale.id?.slice(-6) || index}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                      }}
                    >
                      {new Date(sale.date).toLocaleString("fr-FR")}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#10b981",
                    }}
                  >
                    {formatNumber(sale.total)} FCFA
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#64748b",
                }}
              >
                Aucune vente récente
              </div>
            )}
          </div>
        </div>

        {/* Top produits */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#1a202c",
              margin: "0 0 20px 0",
            }}
          >
            Top Produits
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1a202c",
                        marginBottom: "4px",
                      }}
                    >
                      {product.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                      }}
                    >
                      {product.sales} unités vendues
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#10b981",
                    }}
                  >
                    {formatNumber(product.revenue)} FCFA
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#64748b",
                }}
              >
                Aucun produit vendu
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats globales */}
      <div
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            margin: "0 0 20px 0",
          }}
        >
          Vue d'ensemble
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "8px",
              }}
            >
              Total Produits
            </div>
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}
            >
              {productCatalog.length}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "8px",
              }}
            >
              Total Clients
            </div>
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}
            >
              {customers.length}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "8px",
              }}
            >
              Toutes Ventes
            </div>
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}
            >
              {salesHistory.length}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "8px",
              }}
            >
              CA Total
            </div>
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}
            >
              {formatNumber(
                salesHistory.reduce((sum, s) => sum + (s.total || 0), 0)
              )}{" "}
              FCFA
            </div>
          </div>
        </div>
      </div>

      {/* Animations CSS */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
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
