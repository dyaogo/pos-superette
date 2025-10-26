// pages/dashboard.js - Version Complète et Moderne
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

function DashboardPage() {
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
    // Période actuelle
    const totalRevenue = periodSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalSales = periodSales.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const grossMargin = totalRevenue * 0.37; // 37% de marge brute estimée

    // Période précédente
    const previousRevenue = previousPeriodSales.reduce(
      (sum, sale) => sum + sale.total,
      0
    );
    const previousSales = previousPeriodSales.length;
    const previousTicket =
      previousSales > 0 ? previousRevenue / previousSales : 0;
    const previousMargin = previousRevenue * 0.37;

    // Calcul des tendances (pourcentage de variation)
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
      // Données par heure pour aujourd'hui
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
      // Données par jour pour la semaine
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
      // Données par semaine pour le mois
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
      // Données par mois pour l'année
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

  // Composant StatCard avec tendance
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
      {/* En-tête avec sélecteur de période moderne */}
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

        {/* Sélecteur de période moderne avec boutons */}
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
              onMouseEnter={(e) => {
                if (selectedPeriod !== period.value) {
                  e.currentTarget.style.background = "var(--color-bg)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPeriod !== period.value) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cartes statistiques principales avec tendances */}
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

      {/* Graphique des ventes et marges */}
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
          Évolution des ventes et marges
        </h3>

        <div style={{ overflowX: "auto" }}>
          <div
            style={{ minWidth: "600px", height: "300px", position: "relative" }}
          >
            {chartData.length > 0 ? (
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 300"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Grille de fond */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1="50"
                    y1={50 + i * 50}
                    x2="750"
                    y2={50 + i * 50}
                    stroke="var(--color-border)"
                    strokeWidth="1"
                    strokeDasharray="4"
                  />
                ))}

                {/* Barres */}
                {chartData.map((item, index) => {
                  const maxValue = Math.max(
                    ...chartData.map((d) => Math.max(d.ventes, d.marges))
                  );
                  const barWidth = 600 / chartData.length / 2.5;
                  const spacing = 600 / chartData.length;
                  const x = 80 + index * spacing;

                  const ventesHeight = (item.ventes / maxValue) * 200;
                  const margesHeight = (item.marges / maxValue) * 200;

                  return (
                    <g key={index}>
                      {/* Barre ventes (bleue) */}
                      <rect
                        x={x - barWidth / 2 - 5}
                        y={250 - ventesHeight}
                        width={barWidth}
                        height={ventesHeight}
                        fill="#3b82f6"
                        rx="4"
                      />
                      {/* Barre marges (violette) */}
                      <rect
                        x={x + barWidth / 2 + 5}
                        y={250 - margesHeight}
                        width={barWidth}
                        height={margesHeight}
                        fill="#8b5cf6"
                        rx="4"
                      />
                      {/* Label */}
                      <text
                        x={x}
                        y="280"
                        textAnchor="middle"
                        fontSize="12"
                        fill="var(--color-text-secondary)"
                      >
                        {item.label}
                      </text>
                    </g>
                  );
                })}

                {/* Légende */}
                <g transform="translate(650, 20)">
                  <rect
                    x="0"
                    y="0"
                    width="12"
                    height="12"
                    fill="#3b82f6"
                    rx="2"
                  />
                  <text
                    x="18"
                    y="10"
                    fontSize="12"
                    fill="var(--color-text-primary)"
                  >
                    Ventes
                  </text>
                  <rect
                    x="0"
                    y="20"
                    width="12"
                    height="12"
                    fill="#8b5cf6"
                    rx="2"
                  />
                  <text
                    x="18"
                    y="30"
                    fontSize="12"
                    fill="var(--color-text-primary)"
                  >
                    Marges
                  </text>
                </g>
              </svg>
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-text-secondary)",
                }}
              >
                Aucune donnée disponible pour cette période
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grille à 2 colonnes : Top produits et Alertes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Top produits */}
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

        {/* Alertes et infos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Stock faible */}
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

          {/* Crédits actifs */}
          {stats.activeCredits > 0 && (
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
                <Users size={20} color="#3b82f6" />
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "var(--color-text-primary)",
                  }}
                >
                  Crédits actifs
                </div>
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#3b82f6",
                }}
              >
                {stats.activeCredits}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                  marginTop: "4px",
                }}
              >
                client(s) avec crédit en cours
              </div>
            </div>
          )}

          {/* Info clients */}
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

      {/* Tableau de rentabilité par produit (Admin/Manager uniquement) */}
      <PermissionGate roles={["admin", "manager"]}>
        <div
          style={{
            background: "var(--color-surface)",
            padding: "25px",
            borderRadius: "16px",
            border: "1px solid var(--color-border)",
            marginTop: "30px",
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
                      if (product && product.costPrice) {
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
