import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useDealership } from "../../hooks/useDealership";
import { useAuth } from "../../context/AuthContext";
import { Search, Plus, Car, Edit, Trash2, Star, RefreshCcw, CheckCircle, XCircle, AlertCircle, Tag,} from "lucide-react";
import { toast, Toaster } from "sonner";
import AgregarVehiculo from "../AgregarVehiculo/AgregarVehiculo";
import { deleteImagesFromStorage } from "../../utils/storage";
import "./GestorVehiculos.css";

/* ---------------- VERSIONED CACHE ---------------- */
  const vehiclesCacheKey = (dealershipId) =>
    `vehicles_list:${dealershipId}`;

  const loadVehiclesCache = (dealershipId) => {
    try {
      const raw = localStorage.getItem(vehiclesCacheKey(dealershipId));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const saveVehiclesCache = (dealershipId, payload) => {
    localStorage.setItem(
      vehiclesCacheKey(dealershipId),
      JSON.stringify(payload)
    );
  };

  const clearVehiclesCache = (dealershipId) => {
    localStorage.removeItem(vehiclesCacheKey(dealershipId));
  };

  const dedupeById = (arr) => {
  const map = new Map();
  arr.forEach(item => {
    map.set(item.id, item);
  });
  return Array.from(map.values());
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
  const { isAdmin, isSeller } = useAuth();
  const [totalCount, setTotalCount] = useState(0);
  const [vehiclesVersion, setVehiclesVersion] = useState(null);



  /* ---------- FETCH ---------- */
  const fetchVehicles = async ({ reset = false } = {}) => {
    if (!dealershipId) return;

    setLoading(true);

    console.log("🚗 ==============================");
    console.log("🚗 FETCH VEHICLES START");
    console.log("🏪 Dealership:", dealershipId);

    try {
      // 1️⃣ Obtener versión desde DB
      const { data: versionRow, error: versionError } = await supabase
        .from("dealership_versions")
        .select("vehicles_version")
        .eq("dealership_id", dealershipId)
        .single();

      if (versionError) {
        console.error("❌ Error obteniendo versión:", versionError);
        setLoading(false);
        return;
      }

      const dbVersion = versionRow?.vehicles_version || null;
      console.log("🗂️ DB Version:", dbVersion);

      // 2️⃣ Leer cache local
      const cached = loadVehiclesCache(dealershipId);

      if (cached) {
        console.log("📦 Cache encontrado:");
        console.log("   → Version cache:", cached.version);
        console.log("   → Registros cache:", cached.data?.length);
      } else {
        console.log("📦 No hay cache local");
      }

      // 3️⃣ Si cache válido y no reset → usarlo
      if (cached && cached.version === dbVersion && !reset) {
        console.log("✅ CACHE VÁLIDO → usando datos locales");

        setVehicles(dedupeById(cached.data));
        setTotalCount(cached.totalCount || cached.data.length);

        setLoading(false);
        console.log("🚗 FETCH END (desde cache)");
        console.log("🚗 ==============================");
        return;
      }

      console.log("🌐 CACHE INVÁLIDO → consultando DB...");

      // 4️⃣ Traer TODOS los vehículos (sin paginación)
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, price, stock, destacado, discount, image_urls, thumbnail_url, created_at"
        )
        .eq("dealership_id", dealershipId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error cargando vehículos:", error);
        setLoading(false);
        return;
      }

      const vehiclesData = data || [];

      console.log("📥 DB Registros recibidos:", vehiclesData.length);

      // 5️⃣ Guardar en estado
      setVehicles(vehiclesData);
      setTotalCount(vehiclesData.length);

      // 6️⃣ Guardar en cache
      saveVehiclesCache(dealershipId, {
        version: dbVersion,
        data: vehiclesData,
        totalCount: vehiclesData.length,
        cachedAt: new Date().toISOString(),
      });

      console.log("💾 Cache actualizado correctamente");
      console.log("🚗 FETCH END (desde DB)");
      console.log("🚗 ==============================");
    } catch (err) {
      console.error("🔥 ERROR GENERAL FETCH:", err);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    if (!dealershipId || dealershipLoading) return;
    fetchVehicles({ reset: true });
  }, [dealershipId]);

  /* ---------- CRUD ---------- */
  const handleDeleteVehicle = async (vehicle) => {
    if (!isAdmin) {
      toast.error("No tenés permisos para eliminar vehículos");
      return;
    }
    setConfirm({
      show: true,
      title: "Eliminar vehículo",
      message: "Esto eliminará el vehículo y sus imágenes.",
      onConfirm: async () => {
        try {
          // 1️⃣ borrar storage
          console.log("🧨 Voy a borrar imágenes de:", vehicle.image_urls);
          await deleteImagesFromStorage([
            ...(vehicle.image_urls || []),
            ...(vehicle.thumbnail_url ? [vehicle.thumbnail_url] : []),
          ]);
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
        clearVehiclesCache(dealershipId);
      },
    });
  };



const handleVehicleSubmit = async (payload, imagesToDelete = []) => {
  if (!isAdmin && !isSeller) {
    toast.error("No tenés permisos para guardar vehículos");
    return;
  }
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
      console.log("🛑 Validando límite antes de insertar...");
      console.log("🚗 Total actuales:", totalVehicles);
      console.log("📈 Límite:", MAX_PRODUCTS);

      if (totalVehicles >= MAX_PRODUCTS) {
        toast.error(
          `🚫 Has alcanzado el límite de ${MAX_PRODUCTS} vehículos`
        );
        return;
      }

      const { data } = await supabase
        .from("products")
        .insert({
          ...payload,
          dealership_id: dealershipId,
        })
        .select()
        .single();

      setVehicles(v => dedupeById([data, ...v]));
    }

    setEditingVehicle(null);
    setActiveTab("list");
  } catch (err) {
    console.error("ERROR GUARDANDO VEHÍCULO:", err);
    throw err;
  }
  clearVehiclesCache(dealershipId);
};

  const handleForceRefresh = async () => {
    clearVehiclesCache(dealershipId);
    await fetchVehicles({ reset: true });
    toast.success("Datos actualizados");
  };


// 🔎 Filtrado local (NO consume DB, NO rompe cache)
const filteredVehicles = React.useMemo(() => {
  if (!searchTerm) return vehicles;

  return vehicles.filter((v) =>
    v.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [vehicles, searchTerm]);

console.log(
  "🧮 Render vehicles:",
  vehicles.length,
  "filtered:",
  filteredVehicles.length
);

const loadVehicleForEdit = async (vehicleId) => {
  setLoading(true);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", vehicleId)
    .eq("dealership_id", dealershipId)
    .single();

  setLoading(false);

  if (error) {
    toast.error("No se pudo cargar el vehículo");
    return;
  }

  setEditingVehicle(data);
  setActiveTab("addVehicle");
};



const closeConfirm = () => setConfirm(null);

  const MAX_PRODUCTS = 20;
  const totalVehicles = totalCount;
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
            <button
              className={`tab-btn ${activeTab === "addVehicle" ? "active" : ""}`}
              onClick={() => {
                console.log("➕ Intentando agregar vehículo...");
                console.log("🚗 Total actuales:", totalVehicles);
                console.log("📈 Límite:", MAX_PRODUCTS);

                if (isLimitReached) {
                  toast.error(
                    `🚫 Límite de ${MAX_PRODUCTS} vehículos alcanzado. Actualiza tu plan para agregar más.`
                  );
                  return;
                }

                setEditingVehicle(null);
                setActiveTab("addVehicle");
              }}
            >
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
                              onClick={() => {
                                if (!isAdmin && !isSeller) {
                                  toast.error("No tenés permisos para editar vehículos");
                                  return;
                                }
                                loadVehicleForEdit(vehicle.id);
                              }}
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
                clearVehiclesCache(dealershipId);
                await fetchVehicles({ reset: true }); // 🔥 REFRESH REAL
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