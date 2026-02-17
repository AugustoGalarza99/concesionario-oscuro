import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useDealership } from "../../hooks/useDealership";
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Car,
  MessageCircle,
} from "lucide-react";
import "./VehicleDetail.css";
import Footer from "../Footer/Footer";

// ===============================
// CACHE HELPERS
// ===============================
const cacheKey = (dealershipId, id) =>
  `vehicle_detail_cache_${dealershipId}_${id}`;
const versionKey = (dealershipId, id) =>
  `vehicle_detail_version_${dealershipId}_${id}`;

const loadCache = (dealershipId, id) => {
  const raw = localStorage.getItem(cacheKey(dealershipId, id));
  return raw ? JSON.parse(raw) : null;
};

const saveCache = (dealershipId, id, data) => {
  localStorage.setItem(cacheKey(dealershipId, id), JSON.stringify(data));
};

const getLocalVersion = (dealershipId, id) =>
  localStorage.getItem(versionKey(dealershipId, id));

const setLocalVersion = (dealershipId, id, version) =>
  localStorage.setItem(versionKey(dealershipId, id), version);

// ===============================
// COMPONENT
// ===============================
function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dealershipId, loading: dealershipLoading } = useDealership();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const WHATSAPP_NUMBER = "5493572674920";

  useEffect(() => {
    if (dealershipLoading || !dealershipId || !id) return;

    const init = async () => {
      setLoading(true);
      console.log("🚗 VehicleDetail → chequeando cache/version...");

      // 1️⃣ leer versión global de vehículos
      const { data } = await supabase
        .from("dealership_versions")
        .select("vehicles_version")
        .eq("dealership_id", dealershipId)
        .maybeSingle();

      const dbVersion = data?.vehicles_version || null;
      const localVersion = getLocalVersion(dealershipId, id);
      const cached = loadCache(dealershipId, id);

      // 2️⃣ cache válido
      if (cached && localVersion === dbVersion) {
        console.log("📦 VehicleDetail desde cache (v", dbVersion, ")");
        setVehicle(cached);
        setLoading(false);
        return;
      }

      console.log("🌐 Cache inválido → fetch vehículo");

      // 3️⃣ fetch optimizado (NO select *)
      const { data: vehicleData, error } = await supabase
        .from("products")
        .select(
          `
          id, name, price, discount, stock, description,
          image_urls, thumbnail_url,
          modelo, ano, version, kilometros, combustible, motor,
          potencia, puertas, transmision, color, condicion,
          carroceria, traccion, consumo_mixto, vin
        `
        )
        .eq("id", id)
        .eq("dealership_id", dealershipId)
        .single();

      if (error) {
        console.error("❌ Error cargando vehículo:", error);
        setVehicle(null);
        setLoading(false);
        return;
      }

      const kb = new Blob([JSON.stringify(vehicleData)]).size / 1024;
      console.log(`📦 VehicleDetail payload: ${kb.toFixed(2)} KB`);

      saveCache(dealershipId, id, vehicleData);
      setLocalVersion(dealershipId, id, dbVersion);

      setVehicle(vehicleData);
      setLoading(false);
    };

    init();
  }, [id, dealershipId, dealershipLoading]);

  // ===============================
  // IMÁGENES OPTIMIZADAS
  // ===============================
  const images = useMemo(() => {
    if (vehicle?.image_urls?.length > 0) return vehicle.image_urls;
    if (vehicle?.thumbnail_url) return [vehicle.thumbnail_url];
    return ["https://via.placeholder.com/800x600?text=Sin+Foto"];
  }, [vehicle]);

  const openLightbox = (index) => {
    setSelectedImg(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () =>
    setSelectedImg((prev) => (prev + 1) % images.length);

  const prevImage = () =>
    setSelectedImg((prev) => (prev - 1 + images.length) % images.length);

  // ===============================
  // LOADING / ERROR
  // ===============================
  if (loading || dealershipLoading) {
    return (
      <div className="vd-loading">
        <div className="vd-skeleton-img"></div>
        <div className="vd-skeleton-info">
          <div className="vd-skel-line long"></div>
          <div className="vd-skel-line"></div>
          <div className="vd-skel-line short"></div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="vd-notfound">
        <Car size={90} />
        <h2>Vehículo no encontrado</h2>
        <button onClick={() => navigate("/vehiculos")} className="vd-back-btn">
          ← Volver al catálogo
        </button>
      </div>
    );
  }

  // ===============================
  // PRICE
  // ===============================
  const finalPrice =
    vehicle.discount > 0
      ? vehicle.price * (1 - vehicle.discount / 100)
      : vehicle.price;

  const savings =
    vehicle.discount > 0
      ? vehicle.price * (vehicle.discount / 100)
      : 0;

  const handleWhatsAppContact = () => {
    const message = `Hola! 👋 
Estoy interesado en el vehículo:

🚗 ${vehicle.name}
💰 Precio: $${finalPrice.toLocaleString("es-AR")}

¿Podrían brindarme más información?`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`;

    window.open(url, "_blank");
  };

  const Spec = ({ label, value }) => (
    <div className="vd-spec-card">
      <span className="vd-spec-label">{label}</span>
      <span className="vd-spec-value">{value}</span>
    </div>
  );

  return (
    <>
      <div className="vd-page">
        <div className="vd-container">
          {/* GALERÍA */}
          <div className="vd-gallery">
            <div
              className="vd-main-img-wrapper"
              onClick={() => openLightbox(selectedImg)}
            >
              <button
                className="vd-arrow vd-left"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
              >
                <ChevronLeft size={32} />
              </button>

              {/* 👉 Solo esta se carga eager */}
              <img
                src={images[selectedImg]}
                alt={`${vehicle.name} - Foto ${selectedImg + 1}`}
                className="vd-main-img"
                loading={selectedImg === 0 ? "eager" : "lazy"}
                fetchPriority={selectedImg === 0 ? "high" : "low"}
              />

              {vehicle.discount > 0 && (
                <div className="vd-big-discount">-{vehicle.discount}%</div>
              )}

              {vehicle.stock <= 0 && (
                <div className="vd-soldout">NO DISPONIBLE</div>
              )}

              <button
                className="vd-arrow vd-right"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
              >
                <ChevronRight size={32} />
              </button>
            </div>

            {images.length > 1 && (
              <div className="vd-thumbs">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={
                      i === selectedImg ? "vd-thumb vd-active" : "vd-thumb"
                    }
                  >
                    <img src={img} alt={`Miniatura ${i + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* HEADER INFO */}
          <div className="vd-header-info">
            <h1 className="vd-title">{vehicle.name}</h1>

            {vehicle.stock > 0 ? (
              <span className="vd-available">
                <Zap size={20} /> Disponible
              </span>
            ) : (
              <span className="vd-unavailable">No disponible</span>
            )}

            <div className="vd-price-box">
              {vehicle.discount > 0 ? (
                <>
                  <span className="vd-old-price">
                    ${vehicle.price.toLocaleString("es-AR")}
                  </span>
                  <span className="vd-new-price">
                    ${finalPrice.toLocaleString("es-AR")}
                  </span>
                  <span className="vd-savings">
                    Ahorrás ${savings.toLocaleString("es-AR")}
                  </span>
                </>
              ) : (
                <span className="vd-new-price">
                  ${vehicle.price.toLocaleString("es-AR")}
                </span>
              )}
            </div>

            <p className="vd-desc">
              {vehicle.description || "Sin descripción disponible."}
            </p>

            <button className="vd-contact-btn" onClick={handleWhatsAppContact}>
              <MessageCircle size={24} />
              Contactar Asesor
            </button>
          </div>

          {/* ESPECIFICACIONES */}
          <section className="vd-specs-section">
            <h2 className="vd-specs-title">Ficha técnica</h2>

            <div className="vd-specs-grid">
              {vehicle.modelo && <Spec label="Modelo" value={vehicle.modelo} />}
              {vehicle.ano && <Spec label="Año" value={vehicle.ano} />}
              {vehicle.version && (
                <Spec label="Versión" value={vehicle.version} />
              )}
              {vehicle.kilometros != null && (
                <Spec
                  label="Kilometraje"
                  value={`${vehicle.kilometros.toLocaleString("es-AR")} km`}
                />
              )}
              {vehicle.combustible && (
                <Spec label="Combustible" value={vehicle.combustible} />
              )}
              {vehicle.motor && <Spec label="Motor" value={vehicle.motor} />}
              {vehicle.potencia && (
                <Spec label="Potencia" value={vehicle.potencia} />
              )}
              {vehicle.puertas && (
                <Spec label="Puertas" value={vehicle.puertas} />
              )}
              {vehicle.transmision && (
                <Spec label="Transmisión" value={vehicle.transmision} />
              )}
              {vehicle.color && <Spec label="Color" value={vehicle.color} />}
              {vehicle.condicion && (
                <Spec label="Condición" value={vehicle.condicion} />
              )}
              {vehicle.carroceria && (
                <Spec label="Carrocería" value={vehicle.carroceria} />
              )}
              {vehicle.traccion && (
                <Spec label="Tracción" value={vehicle.traccion} />
              )}
              {vehicle.consumo_mix && (
                <Spec label="Consumo mixto" value={vehicle.consumo_mix} />
              )}
              {vehicle.vin && <Spec label="VIN" value={vehicle.vin} />}
            </div>
          </section>
        </div>
      </div>

      <Footer />

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <div className="vd-lightbox" onClick={closeLightbox}>
          <button className="vd-lightbox-close">×</button>

          <button
            className="vd-lightbox-arrow left"
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
          >
            <ChevronLeft size={48} />
          </button>

          <img
            src={images[selectedImg]}
            alt={`${vehicle.name} - Foto ${selectedImg + 1}`}
            className="vd-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="vd-lightbox-arrow right"
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
          >
            <ChevronRight size={48} />
          </button>
        </div>
      )}
    </>
  );
}

export default VehicleDetail;
