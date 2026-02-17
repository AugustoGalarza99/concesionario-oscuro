import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useDealership } from "../../hooks/useDealership";
import { Search, Plus, Car, Edit, Trash2, Star, RefreshCcw, CheckCircle, XCircle, AlertCircle, Tag,} from "lucide-react";
import { toast, Toaster } from "sonner";
import AgregarVehiculo from "../AgregarVehiculo/AgregarVehiculo";
import "./GestorVehiculos.css";

/* ---------------- CACHE ---------------- */
const CACHE_TTL = 5 * 60 * 1000;

const getCacheKey = (key, dealershipId) =>
  dealershipId ? `${key}_${dealershipId}_v1` : null;

const now = () => Date.now();

const loadCache = (key) => {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (now() - parsed.ts > CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

const saveCache = (key, data) => {
  if (!key) return;
  localStorage.setItem(key, JSON.stringify({ ts: now(), data }));
};


  const deleteImagesFromStorage = async (imageUrls = []) => {
    if (!imageUrls.length) return;

    const paths = imageUrls
      .map((url) => {
        if (!url) return null;
        const parts = url.split("/storage/v1/object/public/products/");
        return parts[1] || null;
      })
      .filter(Boolean);

    if (!paths.length) return;

    const { error } = await supabase
      .storage
      .from("products")
      .remove(paths);

    if (error) {
      console.error("❌ Error borrando imágenes del storage:", error);
      throw error;
    }
  };

  const clearCache = (dealershipId) => {
    if (!dealershipId) return;
    localStorage.removeItem(getCacheKey("vehicles", dealershipId));
    localStorage.removeItem(getCacheKey("categories", dealershipId));
  };


/* ---------------- COMPONENT ---------------- */
export default function GestorVehiculos() {
  const navigate = useNavigate();
  const { dealershipId, loading: dealershipLoading } = useDealership();
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("list");
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);


  /* ---------- FETCH ---------- */
  const fetchData = async (force = false) => {
    if (!dealershipId) return;
    setLoading(true);

    const vehiclesKey = getCacheKey("vehicles", dealershipId);
    const categoriesKey = getCacheKey("categories", dealershipId);

    try {
      if (!force) {
        const cv = loadCache(vehiclesKey);
        const cc = loadCache(categoriesKey);
        if (cv && cc) {
          setVehicles(cv);
          setCategories(cc);
          setLoading(false);
          return;
        }
      }

      const [{ data: vehicles }, { data: categories }] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("dealership_id", dealershipId)
          .order("created_at", { ascending: false }),

        supabase
          .from("categories")
          .select("*")
          .eq("dealership_id", dealershipId)
          .order("name"),
      ]);

      setVehicles(vehicles || []);
      setCategories(categories || []);

      saveCache(vehiclesKey, vehicles || []);
      saveCache(categoriesKey, categories || []);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dealershipLoading || !dealershipId) return;
    fetchData();
  }, [dealershipLoading, dealershipId]);

  /* ---------- CRUD ---------- */
  const handleDeleteVehicle = async (vehicle) => {
    setConfirm({
      show: true,
      title: "Eliminar vehículo",
      message: "Esto eliminará el vehículo y sus imágenes.",
      onConfirm: async () => {
        try {
          // 1️⃣ borrar storage
          await deleteImagesFromStorage(vehicle.image_urls || []);

          // 2️⃣ borrar DB
          await supabase
            .from("products")
            .delete()
            .eq("id", vehicle.id)
            .eq("dealership_id", dealershipId);

          setVehicles((v) => v.filter((x) => x.id !== vehicle.id));
          toast.success("Vehículo eliminado");
        } catch (e) {
          console.error(e);
          toast.error("Error al eliminar");
        } finally {
          setConfirm(null);
        }
      },
    });
  };



const handleVehicleSubmit = async (payload, imagesToDelete = []) => {
  try {
    // 🔥 borrar imágenes del storage
    if (imagesToDelete.length) {
      const paths = imagesToDelete
        .map((url) => url.split("/products/")[1])
        .filter(Boolean);

      if (paths.length) {
        await supabase
          .storage
          .from("products")
          .remove(paths);
      }
    }

    if (editingVehicle) {
      await supabase
        .from("products")
        .update(payload)
        .eq("id", editingVehicle.id)
        .eq("dealership_id", dealershipId);

      setVehicles((v) =>
        v.map((x) =>
          x.id === editingVehicle.id ? { ...x, ...payload } : x
        )
      );
    } else {
      const { data } = await supabase
        .from("products")
        .insert({
          ...payload,
          dealership_id: dealershipId,
        })
        .select()
        .single();

      setVehicles((v) => [data, ...v]);
    }

    setEditingVehicle(null);
    setActiveTab("list");
  } catch (err) {
    console.error("ERROR GUARDANDO VEHÍCULO:", err);
    throw err;
  }
};

  const handleForceRefresh = async () => {
    clearCache(dealershipId);
    await fetchData(true);
    toast.success("Datos actualizados");
  };


  const filteredVehicles = vehicles.filter((v) =>
  `${v.name} ${v.category} ${v.modelo}`
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
);

const handleEditVehicle = (vehicle) => {
  setEditingVehicle(vehicle);
  setActiveTab("addVehicle");
};

const closeConfirm = () => setConfirm(null);

  const MAX_PRODUCTS = 20;
  const totalVehicles = vehicles.length;
  const isLimitReached = totalVehicles >= MAX_PRODUCTS;

  return (
    <>
      <div className="gestor-container">
        <div className="gestor-card">
          <div className="gestor-header">
            <h2 className="gestor-title">
              <Car className="title-icon" />
              Gestión de Vehículos
            </h2>
            <p className="gestor-subtitle">Administra tu catálogo premium</p>
          </div>

          <div className="tabs-container">
            <button className={`tab-btn ${activeTab === "list" ? "active" : ""}`} onClick={() => setActiveTab("list")}>
              Lista de Vehículos
            </button>

            <button className={`tab-btn ${activeTab === "addVehicle" ? "active" : ""}`} onClick={() => { setEditingVehicle(null); setActiveTab("addVehicle"); }}>
              <Plus size={18} /> Nuevo Vehículo
            </button>

            <button className="tab-btn" onClick={() => navigate("/admin/categorias")}>
              <Tag size={18} /> Categorías
            </button>

            <button className="tab-btn" onClick={handleForceRefresh}>
              <RefreshCcw size={16} /> Refrescar
            </button>
          </div>

          {activeTab === "list" && (
            <div className="list-view">
              <div className="vehicles-counter">
                <span className="counter-label">Vehículos</span>

                <span
                  className={`counter-value ${
                    isLimitReached ? "limit" : ""
                  }`}
                >
                  {totalVehicles} / {MAX_PRODUCTS}
                </span>

                {isLimitReached && (
                  <span className="counter-warning">
                    Límite alcanzado
                  </span>
                )}
              </div>

              <div className="search-container">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por modelo o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              {loading ? (
                <div className="skeleton-grid">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton-card">
                      <div className="skeleton-img"></div>
                      <div className="skeleton-line short"></div>
                      <div className="skeleton-line"></div>
                    </div>
                  ))}
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className="empty-state">
                  <Car size={64} strokeWidth={1.5} />
                  <h3>No hay vehículos</h3>
                  <p>Agrega tu primer vehículo para comenzar</p>
                </div>
              ) : (
                <div className="vehicles-table-wrapper">
  <table className="vehicles-table">
    <thead>
      <tr>
        <th>Vehículo</th>
        <th>Precio</th>
        <th>Stock</th>
        <th>Estado</th>
        <th>Acciones</th>
      </tr>
    </thead>

    <tbody>
      {filteredVehicles.map((vehicle) => (
        <tr key={vehicle.id}>
          <td className="vehicle-main">
            <Car size={18} className="vehicle-icon" />
            <span>{vehicle.name}</span>
          </td>

          <td className="price-cell">
            ${vehicle.price.toLocaleString("es-AR")}
          </td>

          <td>
            <span
              className={`stock-pill ${
                vehicle.stock === 0
                  ? "out"
                  : vehicle.stock <= 5
                  ? "low"
                  : "ok"
              }`}
            >
              {vehicle.stock}
            </span>
          </td>

          <td>
            {vehicle.destacado && (
              <span className="tag featured">
                <Star size={12} /> Destacado
              </span>
            )}
            {vehicle.discount > 0 && (
              <span className="tag discount">
                -{vehicle.discount}%
              </span>
            )}
          </td>

          <td className="actions-cell">
            <button
              onClick={() => handleEditVehicle(vehicle)}
              className="icon-btn edit"
              title="Editar"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDeleteVehicle(vehicle)}
              className="icon-btn delete"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

              )}
            </div>
          )}

          {activeTab === "addVehicle" && (
            <AgregarVehiculo       
              onSubmit={handleVehicleSubmit}       
              initialData={editingVehicle}
              categories={categories}
              onClose={async () => {
                setActiveTab("list");
                setEditingVehicle(null);
                clearCache(dealershipId);
                await fetchData(true);
              }}

              loading={loading}
            />
          )}
        </div>
      </div>

      {confirm?.show && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>{confirm.title}</h3>
      <p style={{ color: "#666", marginTop: 8 }}>{confirm.message}</p>

      <div className="modal-actions" style={{ marginTop: 18 }}>
        <button
          className="btn-primary"
          onClick={() => {
            try {
              confirm.onConfirm && confirm.onConfirm();
            } catch (e) {
              console.error(e);
            }
          }}
        >
          Confirmar
        </button>

        <button className="btn-secondary" onClick={closeConfirm}>
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}

    </>
  );
}