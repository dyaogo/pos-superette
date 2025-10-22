import ProtectedRoute from "../components/ProtectedRoute";
import PermissionGate from "../components/PermissionGate";
import { useState } from "react";
import { useApp } from "../src/contexts/AppContext";
import { useAuth } from "../src/contexts/AuthContext";
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
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";

function SalesPage() {
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
  const { currentPage, totalPages, paginatedData, goToPage, hasNext, hasPrev } =
    usePagination(filteredSales, 20);

  // Statistiques
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const averageSale =
    filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  const handleDelete = async (saleId, receiptNumber) => {
    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer la vente ${receiptNumber} ?\nCette action est irréversible.`
      )
    ) {
      const success = await deleteSale(saleId);
      if (success) {
        alert("Vente supprimée avec succès");
      } else {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const viewSale = (sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const printReceipt = (sale) => {
    const printWindow = window.open("", "_blank");
    const cashReceivedLine =
      sale.cashReceived != null
        ? `
    <div class="row">
      <span>Montant reçu:</span>
      <span>${sale.cashReceived.toLocaleString()} FCFA</span>
    </div>
    `
        : "";

    const changeLine =
      sale.change != null
        ? `
    <div class="row">
      <span>Rendu:</span>
      <span>${sale.change.toLocaleString()} FCFA</span>
    </div>
    `
        : "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reçu ${sale.receiptNumber}</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
          h2 { text-align: center; margin-bottom: 20px; }
          .divider { border-top: 2px dashed #000; margin: 15px 0; }
          .row { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-size: 18px; font-weight: bold; margin-top: 15px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          td { padding: 5px 0; }
        </style>
      </head>
      <body>
        <h2>🛒 SUPERETTE</h2>
        <div class="divider"></div>
        <div class="row">
          <span>Reçu #:</span>
          <strong>${sale.receiptNumber}</strong>
        </div>
        <div class="row">
          <span>Date:</span>
          <span>${new Date(sale.createdAt).toLocaleString("fr-FR")}</span>
        </div>
        ${
          sale.customer
            ? `<div class="row"><span>Client:</span><span>${sale.customer.name}</span></div>`
            : ""
        }
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <td><strong>Article</strong></td>
              <td style="text-align: center;"><strong>Qté</strong></td>
              <td style="text-align: right;"><strong>Prix</strong></td>
              <td style="text-align: right;"><strong>Total</strong></td>
            </tr>
          </thead>
          <tbody>
            ${sale.items
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${item.unitPrice.toLocaleString()}</td>
                <td style="text-align: right;">${(
                  item.quantity * item.unitPrice
                ).toLocaleString()}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div class="divider"></div>
        <div class="row total">
          <span>TOTAL:</span>
          <span>${sale.total.toLocaleString()} FCFA</span>
        </div>
        <div class="row">
          <span>Paiement:</span>
          <span>${
            sale.paymentMethod === "cash"
              ? "Espèces"
              : sale.paymentMethod === "mobile"
              ? "Mobile Money"
              : "Crédit"
          }</span>
        </div>
        ${cashReceivedLine}
        ${changeLine}
        <div class="divider"></div>
        <p style="text-align: center; font-size: 12px; margin-top: 20px;">
          Merci de votre visite !<br>
          À bientôt
        </p>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h1
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <FileText size={32} />
          Historique des ventes
        </h1>
      </div>

      {/* Statistiques rapides */}
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
            background: "var(--color-surface)",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              color: "var(--color-text-secondary)",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            Total ventes
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#3b82f6",
            }}
          >
            {filteredSales.length}
          </div>
        </div>

        <div
          style={{
            background: "var(--color-surface)",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              color: "var(--color-text-secondary)",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            Revenu total
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#10b981",
            }}
          >
            {totalRevenue.toLocaleString()} FCFA
          </div>
        </div>

        <div
          style={{
            background: "var(--color-surface)",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              color: "var(--color-text-secondary)",
              marginBottom: "8px",
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
            {Math.round(averageSale).toLocaleString()} FCFA
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
        <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
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
            placeholder="Rechercher par client, reçu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 12px 12px 45px",
              border: "2px solid var(--color-border)",
              borderRadius: "8px",
              background: "var(--color-surface)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            padding: "12px",
            border: "2px solid var(--color-border)",
            borderRadius: "8px",
            minWidth: "150px",
            background: "var(--color-surface)",
            color: "var(--color-text-primary)",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          <option value="all">Toutes les dates</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">7 derniers jours</option>
          <option value="month">Ce mois</option>
        </select>
      </div>

      {/* Tableau des ventes */}
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
        }}
      >
        {paginatedData.length === 0 ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            Aucune vente trouvée
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "var(--color-bg)",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <th style={{ padding: "15px", textAlign: "left" }}>Reçu</th>
                  <th style={{ padding: "15px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "15px", textAlign: "left" }}>Client</th>
                  <th style={{ padding: "15px", textAlign: "right" }}>
                    Montant
                  </th>
                  <th style={{ padding: "15px", textAlign: "center" }}>
                    Paiement
                  </th>
                  <th style={{ padding: "15px", textAlign: "center" }}>
                    Articles
                  </th>
                  <th style={{ padding: "15px", textAlign: "center" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((sale) => (
                  <tr
                    key={sale.id}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <td style={{ padding: "15px" }}>
                      <div style={{ fontWeight: "600", color: "#3b82f6" }}>
                        {sale.receiptNumber}
                      </div>
                    </td>
                    <td style={{ padding: "15px" }}>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {new Date(sale.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {new Date(sale.createdAt).toLocaleTimeString("fr-FR")}
                      </div>
                    </td>
                    <td style={{ padding: "15px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <User size={16} color="var(--color-text-muted)" />
                        <span>{sale.customer?.name || "Client comptant"}</span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "15px",
                        textAlign: "right",
                        fontWeight: "bold",
                        color: "#10b981",
                      }}
                    >
                      {sale.total.toLocaleString()} FCFA
                    </td>
                    <td style={{ padding: "15px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "13px",
                          fontWeight: "600",
                          background:
                            sale.paymentMethod === "cash"
                              ? "#dcfce7"
                              : sale.paymentMethod === "mobile"
                              ? "#dbeafe"
                              : "#fef3c7",
                          color:
                            sale.paymentMethod === "cash"
                              ? "#166534"
                              : sale.paymentMethod === "mobile"
                              ? "#1e40af"
                              : "#92400e",
                        }}
                      >
                        {sale.paymentMethod === "cash"
                          ? "💵 Espèces"
                          : sale.paymentMethod === "mobile"
                          ? "📱 Mobile"
                          : "📝 Crédit"}
                      </span>
                    </td>
                    <td style={{ padding: "15px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          background: "var(--color-bg)",
                          borderRadius: "12px",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        {sale.items?.length || 0} article(s)
                      </span>
                    </td>
                    <td style={{ padding: "15px", textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          onClick={() => viewSale(sale)}
                          style={{
                            padding: "8px 12px",
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                          title="Voir les détails"
                        >
                          <Eye size={16} />
                          Voir
                        </button>

                        <button
                          onClick={() => printReceipt(sale)}
                          style={{
                            padding: "8px 12px",
                            background: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                          title="Imprimer le reçu"
                        >
                          <Printer size={16} />
                          Imprimer
                        </button>

                        <PermissionGate roles={["admin"]}>
                          <button
                            onClick={() =>
                              handleDelete(sale.id, sale.receiptNumber)
                            }
                            style={{
                              padding: "8px 12px",
                              background: "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "13px",
                              fontWeight: "600",
                            }}
                            title="Supprimer (Admin uniquement)"
                          >
                            <Trash2 size={16} />
                            Supprimer
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div
              style={{
                padding: "20px",
                borderTop: "1px solid var(--color-border)",
              }}
            >
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                hasNext={hasNext}
                hasPrev={hasPrev}
              />
            </div>
          </>
        )}
      </div>

      {/* Modal de détail */}
      {showDetailModal && selectedSale && (
        <div
          onClick={() => setShowDetailModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-surface)",
              borderRadius: "12px",
              padding: "30px",
              width: "600px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <FileText size={24} />
                Détails de la vente
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div
              style={{
                background: "var(--color-bg)",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                      marginBottom: "5px",
                    }}
                  >
                    Numéro de reçu
                  </div>
                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#3b82f6",
                      fontSize: "16px",
                    }}
                  >
                    {selectedSale.receiptNumber}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                      marginBottom: "5px",
                    }}
                  >
                    Date et heure
                  </div>
                  <div style={{ fontWeight: "600" }}>
                    {new Date(selectedSale.createdAt).toLocaleString("fr-FR")}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                      marginBottom: "5px",
                    }}
                  >
                    Client
                  </div>
                  <div style={{ fontWeight: "600" }}>
                    {selectedSale.customer?.name || "Client comptant"}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                      marginBottom: "5px",
                    }}
                  >
                    Mode de paiement
                  </div>
                  <div style={{ fontWeight: "600" }}>
                    {selectedSale.paymentMethod === "cash"
                      ? "💵 Espèces"
                      : selectedSale.paymentMethod === "mobile"
                      ? "📱 Mobile Money"
                      : "📝 Crédit"}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h3
                style={{
                  margin: "0 0 15px 0",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                Articles
              </h3>
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
                        padding: "10px",
                        textAlign: "left",
                        fontSize: "13px",
                      }}
                    >
                      Article
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "center",
                        fontSize: "13px",
                      }}
                    >
                      Qté
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "right",
                        fontSize: "13px",
                      }}
                    >
                      Prix unit.
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "right",
                        fontSize: "13px",
                      }}
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items?.map((item, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <td style={{ padding: "10px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Package size={16} color="var(--color-text-muted)" />
                          {item.name}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "center",
                          fontWeight: "600",
                        }}
                      >
                        {item.quantity}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {item.unitPrice.toLocaleString()} FCFA
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        {(item.quantity * item.unitPrice).toLocaleString()} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                background: "var(--color-bg)",
                padding: "20px",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#10b981",
                }}
              >
                <span>TOTAL:</span>
                <span>{selectedSale.total.toLocaleString()} FCFA</span>
              </div>

              {selectedSale.cashReceived != null && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "10px",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <span>Montant reçu:</span>
                  <span>{selectedSale.cashReceived.toLocaleString()} FCFA</span>
                </div>
              )}

              {selectedSale.change != null && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "5px",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <span>Rendu:</span>
                  <span>{selectedSale.change.toLocaleString()} FCFA</span>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => printReceipt(selectedSale)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Printer size={20} />
                Imprimer le reçu
              </button>

              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "var(--color-border)",
                  color: "var(--color-text-primary)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SalesPageProtected() {
  return (
    <ProtectedRoute>
      <SalesPage />
    </ProtectedRoute>
  );
}

export default SalesPageProtected;
