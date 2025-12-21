// Module wrapper pour la page Sales
// Ce module importe et utilise la logique de la page sales

import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  FileText,
  Search,
  Eye,
  Calendar,
  DollarSign,
  User,
  Trash2,
  Printer,
  X,
  Package,
} from "lucide-react";
import { usePagination } from "../../../hooks/usePagination";
import Pagination from "../../../components/Pagination";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function SalesModule() {
  const { salesHistory, loading, deleteSale } = useApp();
  const { currentUser, hasRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filtrer les ventes
  const filteredSales = salesHistory.filter((sale) => {
    const matchesSearch =
      sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const saleDate = new Date(sale.createdAt);
    const today = new Date();
    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "today" &&
        saleDate.toDateString() === today.toDateString()) ||
      (dateFilter === "week" &&
        (today - saleDate) / (1000 * 60 * 60 * 24) <= 7) ||
      (dateFilter === "month" && saleDate.getMonth() === today.getMonth());

    return matchesSearch && matchesDate;
  });

  // Pagination
  const itemsPerPage = 20;
  const { currentPage, totalPages, paginatedData, goToPage, nextPage, prevPage } =
    usePagination(filteredSales, itemsPerPage);

  // Statistiques
  const totalSales = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;

  const handleDeleteSale = async (sale) => {
    // Trouver l'ID de la vente - peut être .id, ._id, ou .receiptNumber
    const saleId = sale?.id || sale?._id || sale?.receiptNumber;

    if (!saleId) {
      console.error('Impossible de trouver l\'ID de la vente:', sale);
      alert('Erreur: Impossible de supprimer cette vente (ID manquant)');
      return;
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer cette vente ?")) {
      console.log('Suppression de la vente:', saleId);
      const result = await deleteSale(saleId);

      if (result.success) {
        if (result.localOnly) {
          console.warn('Vente supprimée de l\'interface uniquement (API non disponible)');
        }
        // Rechargement de la page pour rafraîchir la liste
        window.location.reload();
      } else {
        alert('Erreur lors de la suppression de la vente');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
      {/* Statistiques */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Total ventes
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>{totalSales}</div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Chiffre d'affaires
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {Math.round(totalRevenue).toLocaleString()} FCFA
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            padding: "20px",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            Panier moyen
          </div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>
            {Math.round(avgSale).toLocaleString()} FCFA
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "250px", position: "relative" }}>
          <Search
            size={20}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Rechercher par client, ID, reçu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 12px 12px 45px",
              border: "2px solid var(--color-border)",
              borderRadius: "8px",
              fontSize: "14px",
              background: "var(--color-surface)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { value: "all", label: "Toutes" },
            { value: "today", label: "Aujourd'hui" },
            { value: "week", label: "Cette semaine" },
            { value: "month", label: "Ce mois" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setDateFilter(value)}
              style={{
                padding: "10px 20px",
                background:
                  dateFilter === value
                    ? "var(--color-primary)"
                    : "var(--color-surface)",
                color:
                  dateFilter === value ? "white" : "var(--color-text-primary)",
                border: `2px solid ${
                  dateFilter === value
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
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des ventes */}
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: "var(--color-bg)",
                borderBottom: "2px solid var(--color-border)",
              }}
            >
              <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>
                Date
              </th>
              <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>
                N° Reçu
              </th>
              <th style={{ padding: "15px", textAlign: "left", fontWeight: "600" }}>
                Client
              </th>
              <th style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>
                Articles
              </th>
              <th style={{ padding: "15px", textAlign: "right", fontWeight: "600" }}>
                Montant
              </th>
              <th style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>
                Paiement
              </th>
              <th style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Aucune vente trouvée
                </td>
              </tr>
            ) : (
              paginatedData.map((sale) => (
                <tr
                  key={sale.id}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <td style={{ padding: "15px" }}>
                    {new Date(sale.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td style={{ padding: "15px", fontWeight: "500" }}>
                    {sale.receiptNumber}
                  </td>
                  <td style={{ padding: "15px" }}>
                    {sale.customer?.name || "Client comptant"}
                  </td>
                  <td
                    style={{
                      padding: "15px",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    {sale.items?.length || 0}
                  </td>
                  <td
                    style={{
                      padding: "15px",
                      textAlign: "right",
                      fontWeight: "bold",
                      color: "var(--color-primary)",
                    }}
                  >
                    {Math.round(sale.total).toLocaleString()} FCFA
                  </td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background:
                          sale.paymentMethod === "cash"
                            ? "#d1fae5"
                            : sale.paymentMethod === "credit"
                            ? "#fef3c7"
                            : "#dbeafe",
                        color:
                          sale.paymentMethod === "cash"
                            ? "#065f46"
                            : sale.paymentMethod === "credit"
                            ? "#92400e"
                            : "#1e40af",
                      }}
                    >
                      {sale.paymentMethod === "cash"
                        ? "Espèces"
                        : sale.paymentMethod === "credit"
                        ? "Crédit"
                        : "Mobile"}
                    </span>
                  </td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setShowDetailModal(true);
                        }}
                        style={{
                          padding: "6px 12px",
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title="Voir les détails"
                      >
                        <Eye size={16} />
                      </button>
                      {hasRole("admin") && (
                        <button
                          onClick={() => handleDeleteSale(sale)}
                          style={{
                            padding: "6px 12px",
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: "20px" }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            onNext={nextPage}
            onPrevious={prevPage}
          />
        </div>
      )}

      {/* Modal détails */}
      {showDetailModal && selectedSale && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "12px",
              padding: "30px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>
                Détails de la vente
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "5px",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                    N° Reçu
                  </div>
                  <div style={{ fontWeight: "600" }}>{selectedSale.receiptNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                    Date
                  </div>
                  <div style={{ fontWeight: "600" }}>
                    {new Date(selectedSale.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                    Client
                  </div>
                  <div style={{ fontWeight: "600" }}>
                    {selectedSale.customer?.name || "Client comptant"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                    Paiement
                  </div>
                  <div style={{ fontWeight: "600" }}>
                    {selectedSale.paymentMethod === "cash"
                      ? "Espèces"
                      : selectedSale.paymentMethod === "credit"
                      ? "Crédit"
                      : "Mobile"}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "10px" }}>
                Articles
              </h3>
              <div style={{ border: "1px solid var(--color-border)", borderRadius: "8px", overflow: "hidden" }}>
                {selectedSale.items?.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "12px",
                      borderBottom: index < selectedSale.items.length - 1 ? "1px solid var(--color-border)" : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "600" }}>
                        {item.name || item.productName || item.product?.name || "Produit"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        {item.quantity || 0} × {Math.round(item.price || item.unitPrice || item.sellingPrice || 0).toLocaleString()} FCFA
                      </div>
                    </div>
                    <div style={{ fontWeight: "bold" }}>
                      {Math.round((item.quantity || 0) * (item.price || item.unitPrice || item.sellingPrice || 0)).toLocaleString()} FCFA
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: "2px solid var(--color-border)", paddingTop: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold" }}>
                <span>Total</span>
                <span style={{ color: "var(--color-primary)" }}>
                  {Math.round(selectedSale.total).toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
