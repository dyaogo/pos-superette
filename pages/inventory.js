import ProtectedRoute from "../components/ProtectedRoute";
import PermissionGate from "../components/PermissionGate"; // ✨ AJOUTÉ
import { useState } from "react";
import { useApp } from "../src/contexts/AppContext";
import { useAuth } from "../src/contexts/AuthContext"; // ✨ AJOUTÉ
import ProductImportModal from "../components/ProductImportModal";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingDown,
  X,
  Save,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react";
import ImageUpload from "../components/ImageUpload";

function InventoryPage() {
  const { productCatalog, addProduct, updateProduct, deleteProduct, loading } =
    useApp();
  const { currentUser, hasRole } = useAuth(); // ✨ AJOUTÉ
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Extraire les catégories uniques
  const categories = ["all", ...new Set(productCatalog.map((p) => p.category))];

  // Filtrer les produits
  const filteredProducts = productCatalog
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchTerm));

      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Statistiques (montants arrondis pour FCFA)
  const totalProducts = productCatalog.length;
  const totalValue = Math.round(productCatalog.reduce(
    (sum, p) => sum + p.sellingPrice * p.stock,
    0
  ));
  const lowStockProducts = productCatalog.filter((p) => p.stock < 10).length;

  // ✨ AJOUTÉ - Calculer la valeur d'achat et marge (Admin et Manager uniquement)
  const totalCostValue = Math.round(productCatalog.reduce(
    (sum, p) => sum + p.costPrice * p.stock,
    0
  ));
  const totalMargin = Math.round(totalValue - totalCostValue);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const productData = {
      name: formData.get("name"),
      category: formData.get("category"),
      barcode: formData.get("barcode") || null,
      costPrice: parseFloat(formData.get("costPrice")),
      sellingPrice: parseFloat(formData.get("sellingPrice")),
      stock: parseInt(formData.get("stock")),
      image: formData.get("image") || null,
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
      setEditingProduct(null);
    } else {
      await addProduct(productData);
      setShowAddModal(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Supprimer le produit "${name}" ?`)) {
      await deleteProduct(id);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* En-tête */}
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
          <Package size={32} />
          Inventaire
        </h1>

        <div style={{ display: "flex", gap: "10px" }}>
          {/* ✨ MODIFIÉ - Bouton Import Excel visible seulement pour Admin et Manager */}
          <PermissionGate roles={["admin", "manager"]}>
            <button
              onClick={() => setShowImportModal(true)}
              style={{
                padding: "10px 20px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Upload size={20} />
              Importer Excel
            </button>
          </PermissionGate>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "10px 20px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Plus size={20} />
            Ajouter un produit
          </button>
        </div>
      </div>

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
            padding: "20px",
            background: "var(--color-surface)",
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
            Total produits
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "var(--color-primary)",
            }}
          >
            {totalProducts}
          </div>
        </div>

        <div
          style={{
            padding: "20px",
            background: "var(--color-surface)",
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
            Valeur stock (vente)
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#10b981",
            }}
          >
            {totalValue.toLocaleString()} FCFA
          </div>
        </div>

        {/* ✨ AJOUTÉ - Carte visible seulement pour Admin et Manager */}
        <PermissionGate roles={["admin", "manager"]}>
          <div
            style={{
              padding: "20px",
              background: "var(--color-surface)",
              borderRadius: "12px",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                color: "var(--color-text-secondary)",
                marginBottom: "8px",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Eye size={16} />
              Valeur stock (achat)
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "#f59e0b",
              }}
            >
              {totalCostValue.toLocaleString()} FCFA
            </div>
          </div>
        </PermissionGate>

        {/* ✨ AJOUTÉ - Marge totale visible seulement pour Admin et Manager */}
        <PermissionGate roles={["admin", "manager"]}>
          <div
            style={{
              padding: "20px",
              background: "var(--color-surface)",
              borderRadius: "12px",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                color: "var(--color-text-secondary)",
                marginBottom: "8px",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <TrendingDown size={16} />
              Marge potentielle
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "#8b5cf6",
              }}
            >
              {totalMargin.toLocaleString()} FCFA
            </div>
          </div>
        </PermissionGate>

        <div
          style={{
            padding: "20px",
            background: "var(--color-surface)",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              color: "var(--color-text-secondary)",
              marginBottom: "8px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <AlertTriangle size={16} />
            Stock faible
          </div>
          <div
            style={{ fontSize: "32px", fontWeight: "bold", color: "#ef4444" }}
          >
            {lowStockProducts}
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
              top: "12px",
              color: "#9ca3af",
            }}
          />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 12px 12px 45px",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              background: "var(--color-surface)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: "12px",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            minWidth: "150px",
            background: "var(--color-surface)",
            color: "var(--color-text-primary)",
          }}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "Toutes catégories" : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Liste des produits */}
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
        }}
      >
        {filteredProducts.length === 0 ? (
          <div
            style={{ padding: "60px", textAlign: "center", color: "#9ca3af" }}
          >
            Aucun produit trouvé
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <th style={{ padding: "15px", textAlign: "left" }}>Produit</th>
                <th style={{ padding: "15px", textAlign: "left" }}>
                  Catégorie
                </th>
                {/* ✨ MODIFIÉ - Colonne Prix achat visible seulement pour Admin et Manager */}
                <PermissionGate roles={["admin", "manager"]}>
                  <th style={{ padding: "15px", textAlign: "right" }}>
                    Prix achat
                  </th>
                </PermissionGate>
                <th style={{ padding: "15px", textAlign: "right" }}>
                  Prix vente
                </th>
                {/* ✨ AJOUTÉ - Colonne Marge visible seulement pour Admin et Manager */}
                <PermissionGate roles={["admin", "manager"]}>
                  <th style={{ padding: "15px", textAlign: "right" }}>Marge</th>
                </PermissionGate>
                <th style={{ padding: "15px", textAlign: "center" }}>Stock</th>
                <th style={{ padding: "15px", textAlign: "center" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    background:
                      product.stock < 10
                        ? "rgba(239, 68, 68, 0.05)"
                        : "transparent",
                  }}
                >
                  <td style={{ padding: "15px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "50px",
                            height: "50px",
                            background: "#f3f4f6",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Package size={24} color="#9ca3af" />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: "600" }}>{product.name}</div>
                        {product.barcode && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            Code: {product.barcode}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        background: "#f3f4f6",
                        borderRadius: "12px",
                        fontSize: "13px",
                      }}
                    >
                      {product.category}
                    </span>
                  </td>
                  {/* ✨ MODIFIÉ - Prix achat visible seulement pour Admin et Manager */}
                  <PermissionGate roles={["admin", "manager"]}>
                    <td
                      style={{
                        padding: "15px",
                        textAlign: "right",
                        color: "#f59e0b",
                        fontWeight: "600",
                      }}
                    >
                      {product.costPrice.toLocaleString()} FCFA
                    </td>
                  </PermissionGate>
                  <td
                    style={{
                      padding: "15px",
                      textAlign: "right",
                      color: "#10b981",
                      fontWeight: "600",
                    }}
                  >
                    {product.sellingPrice.toLocaleString()} FCFA
                  </td>
                  {/* ✨ AJOUTÉ - Marge visible seulement pour Admin et Manager */}
                  <PermissionGate roles={["admin", "manager"]}>
                    <td
                      style={{
                        padding: "15px",
                        textAlign: "right",
                        color: "#8b5cf6",
                        fontWeight: "600",
                      }}
                    >
                      {Math.round(
                        product.sellingPrice - product.costPrice
                      ).toLocaleString()}{" "}
                      FCFA
                    </td>
                  </PermissionGate>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontWeight: "600",
                        background: product.stock < 10 ? "#fecaca" : "#dcfce7",
                        color: product.stock < 10 ? "#991b1b" : "#166534",
                      }}
                    >
                      {product.stock}
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
                        onClick={() => setEditingProduct(product)}
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
                        }}
                      >
                        <Edit size={16} />
                        Modifier
                      </button>

                      {/* ✨ MODIFIÉ - Bouton Supprimer visible seulement pour Admin */}
                      <PermissionGate roles={["admin"]}>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
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
                          }}
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
        )}
      </div>

      {/* Modal Ajout */}
      {showAddModal && (
        <ProductModal
          title="Nouveau Produit"
          onClose={() => setShowAddModal(false)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Modal Modification */}
      {editingProduct && (
        <ProductModal
          title="Modifier le Produit"
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Modal d'import Excel */}
      {showImportModal && (
        <ProductImportModal
          isOpen={true}
          onClose={() => setShowImportModal(false)}
          onImportSuccess={() => {
            window.location.reload();
          }}
          productCatalog={productCatalog}
          addProduct={addProduct}
        />
      )}
    </div>
  );
}

function InventoryPageProtected() {
  return (
    <ProtectedRoute requiredPermission="manage_inventory">
      <InventoryPage />
    </ProtectedRoute>
  );
}

export default InventoryPageProtected;

// Composant Modal (reste identique)
function ProductModal({ title, product, onClose, onSubmit }) {
  const [imageData, setImageData] = useState(product?.image || "");

  return (
    <div
      onClick={onClose}
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
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <input type="hidden" name="image" value={imageData} />

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "500",
              }}
            >
              Image
            </label>
            <ImageUpload
              currentImage={imageData}
              onImageChange={setImageData}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "500",
              }}
            >
              Nom du produit *
            </label>
            <input
              type="text"
              name="name"
              defaultValue={product?.name}
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "500",
              }}
            >
              Catégorie *
            </label>
            <input
              type="text"
              name="category"
              defaultValue={product?.category}
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "500",
              }}
            >
              Code-barres
            </label>
            <input
              type="text"
              name="barcode"
              defaultValue={product?.barcode}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
              marginBottom: "15px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "500",
                }}
              >
                Prix d'achat *
              </label>
              <input
                type="number"
                name="costPrice"
                defaultValue={product?.costPrice}
                required
                min="0"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "500",
                }}
              >
                Prix de vente *
              </label>
              <input
                type="number"
                name="sellingPrice"
                defaultValue={product?.sellingPrice}
                required
                min="0"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "500",
              }}
            >
              Stock initial *
            </label>
            <input
              type="number"
              name="stock"
              defaultValue={product?.stock || 0}
              required
              min="0"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                background: "var(--color-border)",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "12px",
                background: "#3b82f6",
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
              <Save size={20} />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
