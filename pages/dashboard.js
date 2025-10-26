// pages/dashboard.js
import React, { useState, useMemo } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { useApp } from "../src/contexts/AppContext";
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Award,
} from "lucide-react";

function DashboardPage() {
  const {
    globalProducts = [],
    salesHistory = [],
    customers = [],
    appSettings = {},
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const isDark = appSettings.darkMode;

  // Fonction pour formater les nombres
  const formatNumber = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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
        endDate = new Date(weekStart);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
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

    const periodSales = (salesHistory || []).filter((sale) => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    const revenue = periodSales.reduce(
      (sum, sale) => sum + (sale.total || 0),
      0
    );
    const transactions = periodSales.length;
    const avgBasket = transactions > 0 ? revenue / transactions : 0;
    const grossMargin = revenue * 0.37; // 37% de marge moyenne

    return { revenue, transactions, avgBasket, grossMargin };
  }, [salesHistory, selectedPeriod]);

  // Calcul des tendances
  const calculateTrends = useMemo(() => {
    const getPreviousPeriodSales = () => {
      const now = new Date();
      let previousStart, previousEnd;

      switch (selectedPeriod) {
        case "today":
          previousStart = new Date(now);
          previousStart.setDate(now.getDate() - 1);
          previousStart.setHours(0, 0, 0, 0);
          previousEnd = new Date(now);
          previousEnd.setDate(now.getDate() - 1);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        case "week":
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay() - 7);
          weekStart.setHours(0, 0, 0, 0);
          previousStart = weekStart;
          previousEnd = new Date(weekStart);
          previousEnd.setDate(previousEnd.getDate() + 6);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        case "month":
          previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        case "year":
          previousStart = new Date(now.getFullYear() - 1, 0, 1);
          previousEnd = new Date(now.getFullYear() - 1, 11, 31);
          previousEnd.setHours(23, 59, 59, 999);
          break;
        default:
          return { revenue: 0, transactions: 0, avgBasket: 0, grossMargin: 0 };
      }

      const previousSales = (salesHistory || []).filter((sale) => {
        const saleDate = new Date(sale.date);
        return saleDate >= previousStart && saleDate <= previousEnd;
      });

      const revenue = previousSales.reduce(
        (sum, sale) => sum + (sale.total || 0),
        0
      );
      const transactions = previousSales.length;
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

  // Génération des données pour le graphique
  const chartData = useMemo(() => {
    const now = new Date();

    switch (selectedPeriod) {
      case "today":
        const todayData = [];
        for (let hour = 0; hour < 24; hour++) {
          const hourSales = salesHistory.filter((sale) => {
            const saleDate = new Date(sale.date);
            return (
              saleDate.toDateString() === now.toDateString() &&
              saleDate.getHours() === hour
            );
          });

          const sales = hourSales.reduce((sum, sale) => sum + sale.total, 0);
          const margin = sales * 0.37;

          todayData.push({
            label: `${hour}h`,
            ventes: sales,
            marges: margin,
          });
        }
        return todayData;

      case "week":
        const weekData = [];
        const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());

        for (let i = 0; i < 7; i++) {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + i);

          const daySales = salesHistory.filter((sale) => {
            const saleDate = new Date(sale.date);
            return saleDate.toDateString() === day.toDateString();
          });

          const sales = daySales.reduce((sum, sale) => sum + sale.total, 0);
          const margin = sales * 0.37;

          weekData.push({
            label: days[i],
            ventes: sales,
            marges: margin,
          });
        }
        return weekData;

      case "month":
        const monthData = [];
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        for (let week = 1; week <= 4; week++) {
          const weekStartDate = new Date(monthStart);
          weekStartDate.setDate((week - 1) * 7 + 1);
          const weekEnd = new Date(weekStartDate);
          weekEnd.setDate(weekStartDate.getDate() + 6);

          const weekSales = salesHistory.filter((sale) => {
            const saleDate = new Date(sale.date);
            return saleDate >= weekStartDate && saleDate <= weekEnd;
          });

          const sales = weekSales.reduce((sum, sale) => sum + sale.total, 0);
          const margin = sales * 0.37;

          monthData.push({
            label: `S${week}`,
            ventes: sales,
            marges: margin,
          });
        }
        return monthData;

      case "year":
        const yearData = [];
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
          const monthSales = salesHistory.filter((sale) => {
            const saleDate = new Date(sale.date);
            return (
              saleDate.getFullYear() === now.getFullYear() &&
              saleDate.getMonth() === month
            );
          });

          const sales = monthSales.reduce((sum, sale) => sum + sale.total, 0);
          const margin = sales * 0.37;

          yearData.push({
            label: months[month],
            ventes: sales,
            marges: margin,
          });
        }
        return yearData;

      default:
        return [];
    }
  }, [salesHistory, selectedPeriod]);

  // Top produits vendus
  const topProducts = useMemo(() => {
    const productSales = {};

    const now = new Date();
    let startDate;

    switch (selectedPeriod) {
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    }

    salesHistory
      .filter((sale) => new Date(sale.date) >= startDate)
      .forEach((sale) => {
        sale.items?.forEach((item) => {
          if (!productSales[item.name]) {
            productSales[item.name] = { sales: 0, revenue: 0 };
          }
          productSales[item.name].sales += item.quantity;
          productSales[item.name].revenue += item.quantity * item.price;
        });
      });

    return Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [salesHistory, selectedPeriod]);

  // Composant StatCard
  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color,
    marginPercentage,
  }) => (
    <div
      style={{
        background: isDark ? "#2d3748" : "white",
        borderRadius: "16px",
        padding: "24px",
        border: `1px solid ${isDark ? "#4a5568" : "#e2e8f0"}`,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
        }}
      >
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
          <Icon size={24} color={color} />
        </div>
        {trend !== undefined && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "6px",
              background: trend >= 0 ? "#d1fae515" : "#fee2e215",
              color: trend >= 0 ? "#10b981" : "#ef4444",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            {trend >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: "14px",
          color: isDark ? "#a0aec0" : "#64748b",
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
          color: isDark ? "#f7fafc" : "#1a202c",
          marginBottom: marginPercentage ? "4px" : "0",
        }}
      >
        {value}
      </div>

      {marginPercentage && (
        <div
          style={{
            fontSize: "12px",
            color: isDark ? "#a0aec0" : "#64748b",
          }}
        >
          {marginPercentage}% de marge
        </div>
      )}
    </div>
  );

  // Composant SimpleChart
  const SimpleChart = ({ data, title, subtitle }) => {
    if (!data || data.length === 0) {
      return (
        <div
          style={{
            background: isDark ? "#2d3748" : "white",
            borderRadius: "16px",
            padding: "24px",
            border: `1px solid ${isDark ? "#4a5568" : "#e2e8f0"}`,
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: isDark ? "#f7fafc" : "#1a202c",
              margin: "0 0 8px 0",
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: isDark ? "#a0aec0" : "#64748b",
              margin: "0 0 20px 0",
            }}
          >
            {subtitle}
          </p>
          <div
            style={{
              padding: "40px",
              color: isDark ? "#a0aec0" : "#64748b",
              textAlign: "center",
            }}
          >
            Aucune donnée pour cette période
          </div>
        </div>
      );
    }

    const maxValue = Math.max(
      ...data.map((item) => Math.max(item.ventes || 0, item.marges || 0))
    );

    return (
      <div
        style={{
          background: isDark ? "#2d3748" : "white",
          borderRadius: "16px",
          padding: "24px",
          border: `1px solid ${isDark ? "#4a5568" : "#e2e8f0"}`,
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: isDark ? "#f7fafc" : "#1a202c",
            margin: "0 0 8px 0",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: isDark ? "#a0aec0" : "#64748b",
            margin: "0 0 24px 0",
          }}
        >
          {subtitle}
        </p>

        {/* Légende */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            marginBottom: "24px",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                background: "#3b82f6",
                borderRadius: "4px",
              }}
            />
            <span
              style={{
                fontSize: "14px",
                color: isDark ? "#a0aec0" : "#64748b",
              }}
            >
              Ventes
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                background: "#8b5cf6",
                borderRadius: "4px",
              }}
            />
            <span
              style={{
                fontSize: "14px",
                color: isDark ? "#a0aec0" : "#64748b",
              }}
            >
              Marges Brutes
            </span>
          </div>
        </div>

        {/* Graphique */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
            height: "300px",
            padding: "0 16px",
          }}
        >
          {data.map((item, index) => {
            const ventesHeight = (item.ventes / maxValue) * 100;
            const margesHeight = (item.marges / maxValue) * 100;

            return (
              <div
                key={index}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "4px",
                    alignItems: "flex-end",
                    width: "100%",
                    height: "250px",
                  }}
                >
                  {/* Barre Ventes */}
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        background: "#3b82f6",
                        height: `${ventesHeight}%`,
                        borderRadius: "4px 4px 0 0",
                        minHeight: item.ventes > 0 ? "4px" : "0",
                        position: "relative",
                        transition: "height 0.3s ease",
                      }}
                    >
                      {item.ventes > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "-24px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            fontSize: "10px",
                            fontWeight: "600",
                            color: "#3b82f6",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatNumber(Math.round(item.ventes))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Barre Marges */}
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        background: "#8b5cf6",
                        height: `${margesHeight}%`,
                        borderRadius: "4px 4px 0 0",
                        minHeight: item.marges > 0 ? "4px" : "0",
                        position: "relative",
                        transition: "height 0.3s ease",
                      }}
                    >
                      {item.marges > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "-24px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            fontSize: "10px",
                            fontWeight: "600",
                            color: "#8b5cf6",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatNumber(Math.round(item.marges))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Label */}
                <div
                  style={{
                    fontSize: "12px",
                    color: isDark ? "#a0aec0" : "#64748b",
                    fontWeight: "500",
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        padding: "24px",
        background: isDark ? "#1a202c" : "#f7fafc",
        minHeight: "100vh",
      }}
    >
      {/* En-tête avec sélecteur de période */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: isDark ? "#f7fafc" : "#1a202c",
              margin: "0 0 8px 0",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Tableau de Bord
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: isDark ? "#a0aec0" : "#64748b",
              margin: 0,
            }}
          >
            Vue d'ensemble •{" "}
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Sélecteur de période */}
        <div
          style={{
            display: "flex",
            background: isDark ? "#2d3748" : "white",
            borderRadius: "12px",
            padding: "4px",
            border: `1px solid ${isDark ? "#4a5568" : "#e2e8f0"}`,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          {["today", "week", "month", "year"].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              style={{
                padding: "10px 16px",
                border: "none",
                borderRadius: "8px",
                background:
                  selectedPeriod === period ? "#3b82f6" : "transparent",
                color:
                  selectedPeriod === period
                    ? "white"
                    : isDark
                    ? "#a0aec0"
                    : "#64748b",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontSize: "14px",
              }}
            >
              {period === "today"
                ? "Aujourd'hui"
                : period === "week"
                ? "Semaine"
                : period === "month"
                ? "Mois"
                : "Année"}
            </button>
          ))}
        </div>
      </div>

      {/* Bouton actualiser */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1000);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            background: isDark ? "#4a5568" : "#e2e8f0",
            color: isDark ? "#f7fafc" : "#2d3748",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s ease",
          }}
        >
          <RefreshCw
            size={16}
            style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
          />
          Actualiser
        </button>
      </div>

      {/* Statistiques principales */}
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
        />

        <StatCard
          title="Marge Brute"
          value={`${formatNumber(
            Math.round(getMetricsForPeriod.grossMargin)
          )} FCFA`}
          icon={TrendingUp}
          trend={calculateTrends.margin}
          color="#8b5cf6"
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
        />

        <StatCard
          title="Panier Moyen"
          value={`${formatNumber(
            Math.round(getMetricsForPeriod.avgBasket)
          )} FCFA`}
          icon={Award}
          trend={calculateTrends.basket}
          color="#f59e0b"
        />
      </div>

      {/* Graphique */}
      <div style={{ marginBottom: "32px" }}>
        <SimpleChart
          data={chartData}
          title={`Évolution des Ventes et Marges - ${
            selectedPeriod === "today"
              ? "Aujourd'hui"
              : selectedPeriod === "week"
              ? "Cette Semaine"
              : selectedPeriod === "month"
              ? "Ce Mois"
              : "Cette Année"
          }`}
          subtitle={
            selectedPeriod === "today"
              ? "Données par heure"
              : selectedPeriod === "week"
              ? "Données par jour"
              : selectedPeriod === "month"
              ? "Données par semaine"
              : "Données par mois"
          }
        />
      </div>

      {/* Top produits */}
      <div
        style={{
          background: isDark ? "#2d3748" : "white",
          borderRadius: "16px",
          padding: "24px",
          border: `1px solid ${isDark ? "#4a5568" : "#e2e8f0"}`,
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: isDark ? "#f7fafc" : "#1a202c",
            margin: "0 0 20px 0",
          }}
        >
          Top Produits
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {topProducts.length > 0 ? (
            topProducts.map((product, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  background: isDark ? "#374151" : "#f8fafc",
                  borderRadius: "8px",
                  border: `1px solid ${isDark ? "#4a5568" : "#e2e8f0"}`,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: isDark ? "#f7fafc" : "#1a202c",
                      marginBottom: "4px",
                    }}
                  >
                    {product.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: isDark ? "#a0aec0" : "#64748b",
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
                color: isDark ? "#a0aec0" : "#64748b",
              }}
            >
              Aucun produit vendu
            </div>
          )}
        </div>
      </div>

      {/* Alertes stock faible */}
      {globalProducts.filter((p) => p.stock <= (p.minStock || 5)).length >
        0 && (
        <div
          style={{
            marginTop: "24px",
            background: "linear-gradient(135deg, #fef3c7, #fed7af)",
            borderRadius: "16px",
            padding: "20px",
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
              {
                globalProducts.filter((p) => p.stock <= (p.minStock || 5))
                  .length
              }{" "}
              produit(s) nécessitent un réapprovisionnement
            </p>
          </div>
        </div>
      )}

      {/* Animation CSS */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
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
