// pages/dashboard.js - Version CORRIGÉE avec props passées correctement
import ProtectedRoute from "../components/ProtectedRoute";
import PermissionGate from "../components/PermissionGate";
import { useState, useMemo } from "react";
import { useApp } from "../src/contexts/AppContext";
import { useAuth } from "../src/contexts/AuthContext";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Eye,
  Calendar,
  Target,
  Activity,
} from "lucide-react";

// ✅ CRITIQUE : Forcer le SSR avec getServerSideProps
export async function getServerSideProps() {
  return {
    props: {
      timestamp: Date.now(),
    },
  };
}

function DashboardPage({ timestamp }) {
  const { salesHistory, productCatalog, customers, credits, loading } =
    useApp();
  const { currentUser, hasRole } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  // Fonction pour obtenir les dates de début et fin selon la période
  const getDateRange = () => {
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
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
    }

    return { start: startDate, end: endDate };
  };

  const { start, end } = getDateRange();

  // Filtrer les ventes de la période actuelle
  const periodSales = useMemo(() => {
    return salesHistory.filter((sale) => {
      const saleDate = new Date(sale.createdAt || sale.date);
      return saleDate >= start && saleDate <= end;
    });
  }, [salesHistory, start, end]);

  // Obtenir les ventes de la période précédente pour comparaison
  const previousPeriodSales = useMemo(() => {
    const periodDuration = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - periodDuration);
    const previousEnd = new Date(start.getTime() - 1);

    return salesHistory.filter((sale) => {
      const saleDate = new Date(sale.createdAt || sale.date);
      return saleDate >= previousStart && saleDate <= previousEnd;
    });
  }, [salesHistory, start, end]);

  // Calcul des statistiques avec tendances
  const stats = useMemo(() => {
    const totalRevenue = periodSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalSales = periodSales.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const grossMargin = totalRevenue * 0.37;

    const previousRevenue = previousPeriodSales.reduce(
      (sum, sale) => sum + sale.total,
      0
    );
    const previousSales = previousPeriodSales.length;
    const previousTicket =
      previousSales > 0 ? previousRevenue / previousSales : 0;
    const previousMargin = previousRevenue * 0.37;

    const calculateTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      totalRevenue,
      totalSales,
      averageTicket,
      grossMargin,
      totalCustomers: customers.length,
      lowStock: productCatalog.filter((p) => p.stock < 10).length,
      activeCredits: credits.filter((c) => c.status !== "paid").length,
      trends: {
        revenue: calculateTrend(totalRevenue, previousRevenue),
        sales: calculateTrend(totalSales, previousSales),
        ticket: calculateTrend(averageTicket, previousTicket),
        margin: calculateTrend(grossMargin, previousMargin),
      },
    };
  }, [periodSales, previousPeriodSales, productCatalog, customers, credits]);

  // Top produits vendus
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

  // Données pour le graphique
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();

    if (selectedPeriod === "today") {
      for (let hour = 0; hour < 24; hour++) {
        const hourSales = periodSales.filter((sale) => {
          const saleDate = new Date(sale.createdAt || sale.date);
          return saleDate.getHours() === hour;
        });
        const sales = hourSales.reduce((sum, sale) => sum + sale.total, 0);
        const margin = sales * 0.37;

        data.push({
          label: `${hour}h`,
          ventes: Math.round(sales),
          marges: Math.round(margin),
        });
      }
    } else if (selectedPeriod === "week") {
      const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        day.setHours(0, 0, 0, 0);

        const daySales = periodSales.filter((sale) => {
          const saleDate = new Date(sale.createdAt || sale.date);
          return saleDate.toDateString() === day.toDateString();
        });

        const sales = daySales.reduce((sum, sale) => sum + sale.total, 0);
        const margin = sales * 0.37;

        data.push({
          label: days[day.getDay()],
          ventes: Math.round(sales),
          marges: Math.round(margin),
        });
      }
    } else if (selectedPeriod === "month") {
      for (let week = 1; week <= 4; week++) {
        const weekStart = new Date(start);
        weekStart.setDate(start.getDate() + (week - 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekSales = periodSales.filter((sale) => {
          const saleDate = new Date(sale.createdAt || sale.date);
          return saleDate >= weekStart && saleDate <= weekEnd;
        });

        const sales = weekSales.reduce((sum, sale) => sum + sale.total, 0);
        const margin = sales * 0.37;

        data.push({
          label: `S${week}`,
          ventes: Math.round(sales),
          marges: Math.round(margin),
        });
      }
    } else {
      const months = [
        "Jan",
        "Fév",
        "Mar",
        "Avr",
        "Mai",
        "Jun",
        "Jul",
        "Aoû",
        "Sep",
        "Oct",
        "Nov",
        "Déc",
      ];
      for (let month = 0; month < 12; month++) {
        const monthSales = periodSales.filter((sale) => {
          const saleDate = new Date(sale.createdAt || sale.date);
          return saleDate.getMonth() === month;
        });

        const sales = monthSales.reduce((sum, sale) => sum + sale.total, 0);
        const margin = sales * 0.37;

        data.push({
          label: months[month],
          ventes: Math.round(sales),
          marges: Math.round(margin),
        });
      }
    }

    return data;
  }, [periodSales, selectedPeriod, start]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color,
    suffix = "",
  }) => (
    <div
      style={{
        background: "var(--color-surface)",
        padding: "25px",
        borderRadius: "16px",
        border: "1px solid var(--color-border)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "15px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "14px",
              color: "var(--color-text-secondary)",
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
              color: "var(--color-text-primary)",
              marginBottom: "8px",
            }}
          >
            {typeof value === "number" ? value.toLocaleString() : value}{" "}
            {suffix}
          </div>
          {trend !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {trend > 0 ? (
                <ArrowUp size={16} color="#10b981" />
              ) : trend < 0 ? (
                <ArrowDown size={16} color="#ef4444" />
              ) : null}
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color:
                    trend > 0 ? "#10b981" : trend < 0 ? "#ef4444" : "#6b7280",
                }}
              >
                {Math.abs(trend).toFixed(1)}%
              </span>
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                }}
              >
                vs période précédente
              </span>
            </div>
          )}
        </div>
        <div
          style={{
            background: `${color}15`,
            padding: "12px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={28} color={color} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: "var(--color-text-secondary)" }}>
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Badge de vérification dynamique avec timestamp */}
      <div
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          background: "#10b981",
          color: "white",
          padding: "8px 12px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: "600",
          zIndex: 9999,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        🔄 SSR Actif - {new Date(timestamp).toLocaleTimeString()}
      </div>

      {/* En-tête avec sélecteur de période */}
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
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Activity size={36} color="#6366f1" />
            Tableau de bord
          </h1>
          <p
            style={{
              margin: "8px 0 0 0",
              color: "var(--color-text-secondary)",
              fontSize: "16px",
            }}
          >
            Vue d'ensemble de votre activité
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            background: "var(--color-surface)",
            padding: "6px",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          {[
            { value: "today", label: "Aujourd'hui" },
            { value: "week", label: "Semaine" },
            { value: "month", label: "Mois" },
            { value: "year", label: "Année" },
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              style={{
                padding: "10px 20px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.2s ease",
                background:
                  selectedPeriod === period.value ? "#6366f1" : "transparent",
                color:
                  selectedPeriod === period.value
                    ? "white"
                    : "var(--color-text-secondary)",
              }}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cartes statistiques */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <StatCard
          title="Chiffre d'affaires"
          value={stats.totalRevenue}
          icon={DollarSign}
          trend={stats.trends.revenue}
          color="#10b981"
          suffix="FCFA"
        />
        <StatCard
          title="Nombre de ventes"
          value={stats.totalSales}
          icon={ShoppingBag}
          trend={stats.trends.sales}
          color="#3b82f6"
        />
        <StatCard
          title="Panier moyen"
          value={Math.round(stats.averageTicket)}
          icon={Target}
          trend={stats.trends.ticket}
          color="#f59e0b"
          suffix="FCFA"
        />
        <PermissionGate roles={["admin", "manager"]}>
          <StatCard
            title="Marge brute"
            value={Math.round(stats.grossMargin)}
            icon={TrendingUp}
            trend={stats.trends.margin}
            color="#8b5cf6"
            suffix="FCFA"
          />
        </PermissionGate>
      </div>

      {/* Graphique SVG simplifié */}
      <div
        style={{
          background: "var(--color-surface)",
          padding: "25px",
          borderRadius: "16px",
          border: "1px solid var(--color-border)",
          marginBottom: "30px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
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
          <Calendar size={20} color="#6366f1" />
          Évolution des ventes
        </h3>
        <div
          style={{
            height: "200px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-secondary)",
          }}
        >
          Graphique des ventes (données prêtes : {chartData.length} points)
        </div>
      </div>

      {/* Reste du contenu... (simplifié pour la taille) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "20px",
        }}
      >
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
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Package size={20} color="#10b981" />
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
                    padding: "15px",
                    background: "var(--color-bg)",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "var(--color-text-primary)",
                        marginBottom: "4px",
                      }}
                    >
                      {product.name}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {product.quantity} unités vendues
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#10b981",
                    }}
                  >
                    {product.revenue.toLocaleString()} FCFA
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "var(--color-text-secondary)",
                }}
              >
                Aucun produit vendu
              </div>
            )}
          </div>
        </div>

        {/* Alertes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {stats.lowStock > 0 && (
            <div
              style={{
                background: "linear-gradient(135deg, #fef3c7, #fed7aa)",
                padding: "20px",
                borderRadius: "16px",
                border: "2px solid #f59e0b",
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <AlertTriangle size={28} color="#d97706" />
              <div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#92400e",
                    marginBottom: "4px",
                  }}
                >
                  Attention : Stock Faible
                </div>
                <div style={{ fontSize: "14px", color: "#d97706" }}>
                  {stats.lowStock} produit(s) nécessitent un réapprovisionnement
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              background: "var(--color-surface)",
              padding: "20px",
              borderRadius: "16px",
              border: "1px solid var(--color-border)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <Users size={20} color="#10b981" />
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "var(--color-text-primary)",
                }}
              >
                Base clients
              </div>
            </div>
            <div
              style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}
            >
              {stats.totalCustomers}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--color-text-secondary)",
                marginTop: "4px",
              }}
            >
              clients enregistrés
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ CORRECTION : Passer timestamp au composant enfant
function DashboardPageProtected({ timestamp }) {
  return (
    <ProtectedRoute>
      <DashboardPage timestamp={timestamp} />
    </ProtectedRoute>
  );
}

export default DashboardPageProtected;
