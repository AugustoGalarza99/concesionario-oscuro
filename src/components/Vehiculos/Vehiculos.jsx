import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useDealership } from "../../hooks/useDealership";
import { Search, Car, ChevronLeft, ChevronRight } from "lucide-react";
import "./Vehiculos.css";
import Footer from "../Footer/Footer";

// ===============================
// CACHE HELPERS
// ===============================
const cacheKey = (dealershipId) => `vehicles_list_cache_${dealershipId}`;
const versionKey = (dealershipId) => `vehicles_list_version_${dealershipId}`;

const loadCache = (dealershipId) => {
  const raw = localStorage.getItem(cacheKey(dealershipId));
  return raw ? JSON.parse(raw) : null;
};

const saveCache = (dealershipId, data) => {
  localStorage.setItem(cacheKey(dealershipId), JSON.stringify(data));
};

const getLocalVersion = (dealershipId) =>
  localStorage.getItem(versionKey(dealershipId));

const setLocalVersion = (dealershipId, version) =>
  localStorage.setItem(versionKey(dealershipId), version);

// ===============================
// COMPONENT
// ===============================
function Vehiculos() {
  const { dealershipId, loading: dealershipLoading } = useDealership();

  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const vehiclesPerPage = 12;

  // ===============================
  // CARGA INICIAL + CACHE
  // ===============================
  useEffect(() => {
    if (dealershipLoading || !dealershipId) return;

    const init = async () => {
      setLoading(true);
      console.log("🚗 Vehículos → chequeando versión...");

      // 1️⃣ versión desde DB
      const { data } = await supabase
        .from("dealership_versions")
        .select("vehicles_version")
        .eq("dealership_id", dealershipId)
        .maybeSingle();

      const dbVersion = data?.vehicles_version || null;
      const localVersion = getLocalVersion(dealershipId);
      const cached = loadCache(dealershipId);

      // 2️⃣ cache válido
      if (cached && localVersion === dbVersion) {
        console.log("📦 Vehículos LISTA desde cache (v", dbVersion, ")");
        setVehicles(cached.vehicles);
        setFilteredVehicles(cached.vehicles);
        setCategories(cached.categories);
        setLoading(false);
        return;
      }

      console.log("🌐 Cache inválido → fetch liviano de vehículos");

      // 3️⃣ fetch optimizado (SIN image_urls)
      const [
        { data: vehiclesData },
        { data: categoriesData },
      ] = await Promise.all([
        supabase
          .from("products")
          .select(
            "id, name, price, discount, stock, category, subcategory, thumbnail_url, ano, kilometros"
          )
          .eq("dealership_id", dealershipId),

        supabase
          .from("categories")
          .select("id, name")
          .eq("dealership_id", dealershipId),
      ]);

      const payload = {
        vehicles: vehiclesData || [],
        categories: categoriesData || [],
        cachedAt: new Date().toISOString(),
      };

      const kb = new Blob([JSON.stringify(payload)]).size / 1024;
      console.log(`📦 Payload vehículos LISTA: ${kb.toFixed(2)} KB`);

      saveCache(dealershipId, payload);
      setLocalVersion(dealershipId, dbVersion);

      setVehicles(payload.vehicles);
      setFilteredVehicles(payload.vehicles);
      setCategories(payload.categories);
      setLoading(false);
    };

    init();
  }, [dealershipId, dealershipLoading]);

  // ===============================
  // SUBCATEGORÍAS
  // ===============================
  const availableSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    const subs = vehicles
      .filter((v) => v.category === selectedCategory && v.subcategory)
      .map((v) => v.subcategory);
    return [...new Set(subs)];
  }, [vehicles, selectedCategory]);

  // ===============================
  // FILTROS
  // ===============================
  useEffect(() => {
    let result = [...vehicles];

    if (selectedCategory)
      result = result.filter((v) => v.category === selectedCategory);

    if (selectedSubcategory)
      result = result.filter((v) => v.subcategory === selectedSubcategory);

    if (searchTerm)
      result = result.filter((v) =>
        v.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    setFilteredVehicles(result);
    setCurrentPage(1);
  }, [vehicles, selectedCategory, selectedSubcategory, searchTerm]);

  // ===============================
  // PAGINACIÓN
  // ===============================
  const indexOfLast = currentPage * vehiclesPerPage;
  const indexOfFirst = indexOfLast - vehiclesPerPage;
  const currentVehicles = filteredVehicles.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredVehicles.length / vehiclesPerPage);

  return (
    <div className="veh-page">
      <div className="veh-header">
        <h1 className="veh-title">
          <Car size={40} /> Nuestros Vehículos
        </h1>
        <p className="veh-subtitle">Explorá nuestra flota disponible</p>
      </div>

      <div className="veh-container">
        {/* FILTROS */}
        <div className="veh-filters-horizontal">
          <div className="veh-filter-search">
            <Search size={22} />
            <input
              type="text"
              placeholder="Buscar vehículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="veh-filter-select"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory("");
            }}
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            className="veh-filter-select"
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            disabled={!selectedCategory}
          >
            <option value="">Todas las subcategorías</option>
            {availableSubcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* GRID */}
        <div className="veh-main">
          <div className="veh-grid">
            {loading ? (
              [...Array(12)].map((_, i) => (
                <div key={i} className="veh-card veh-skeleton" />
              ))
            ) : currentVehicles.length === 0 ? (
              <div className="veh-no-results">
                <Car size={80} />
                <p>No se encontraron vehículos</p>
              </div>
            ) : (
              currentVehicles.map((vehicle) => {
                const precioFinal =
                  vehicle.discount > 0
                    ? vehicle.price * (1 - vehicle.discount / 100)
                    : vehicle.price;

                return (
                  <div key={vehicle.id} className="veh-card">
                    <Link to={`/vehiculo/${vehicle.id}`} className="veh-link">
                      <div className="veh-image-container">
                        <img
                          src={vehicle.thumbnail_url || "/placeholder.webp"}
                          alt={vehicle.name}
                          loading="lazy"
                          decoding="async"
                          width="300"
                          height="200"
                          style={{ objectFit: "cover" }}
                        />
                        {vehicle.discount > 0 && (
                          <div className="veh-discount-badge">
                            -{vehicle.discount}%
                          </div>
                        )}
                        {vehicle.stock <= 0 && (
                          <div className="veh-outstock-overlay">
                            No disponible
                          </div>
                        )}
                      </div>
                      <div className="veh-info">
                        <div className="veh-info-top">
                          <h3 className="veh-name">{vehicle.name}</h3>
                          <p className="veh-detail">
                            <strong>Modelo:</strong> {vehicle.ano || "—"}
                          </p>
                          <p className="veh-detail">
                            <strong>Kilómetros:</strong>{" "}
                            {vehicle.kilometros != null
                              ? `${Number(vehicle.kilometros).toLocaleString("es-AR")} km`
                              : "0 km"}
                          </p>
                        </div>
                        <div className="veh-final-price">
                          ${precioFinal.toLocaleString("es-AR")}
                        </div>
                      </div>
                    </Link>
                    <Link
                      to={`/vehiculo/${vehicle.id}`}
                      className="veh-add-btn"
                    >
                      Más información
                    </Link>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="veh-pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="veh-page-btn"
              >
                <ChevronLeft size={20} />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`veh-page-btn ${
                    currentPage === i + 1 ? "veh-active" : ""
                  }`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="veh-page-btn"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Vehiculos;
