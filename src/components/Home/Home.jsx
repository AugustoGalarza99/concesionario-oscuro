import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Link } from "react-router-dom";
import Carousel from "../Carousel/Carousel";
import { useDealership } from "../../hooks/useDealership";
import { Car, Zap, Star, Truck, ChevronRight, Sparkles, Users, Phone, Mail, MapPin,} from "lucide-react";
import "./Home.css";
import Footer from "../Footer/Footer";

const cacheKey = (dealershipId) => `home_cache_${dealershipId}`;
const versionKey = (dealershipId) => `home_version_${dealershipId}`;

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


function Home() {
  const { dealershipId, loading: dealershipLoading } = useDealership();
  const [destacados, setDestacados] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasBanners, setHasBanners] = useState(false);

  useEffect(() => {
  if (dealershipLoading || !dealershipId) return;

  const init = async () => {
    setLoading(true);

    // 1️⃣ leer versión
    const { data } = await supabase
      .from("dealership_versions")
      .select("home_version")
      .eq("dealership_id", dealershipId)
      .maybeSingle();

    const dbVersion = data?.home_version || null;
    const localVersion = getLocalVersion(dealershipId);
    const cached = loadCache(dealershipId);

    // 2️⃣ cache válido
    if (cached && localVersion === dbVersion) {
      console.log("📦 Home desde cache (válido)");
        setDestacados(cached.destacados);
        setOfertas(cached.ofertas);
        setClientes(cached.clientes);
        return setLoading(false);
    }

    console.log("♻️ Cache inválido → refetch");

    // 3️⃣ fetch completo
    const [
      { data: destacadosData },
      { data: ofertasData },
      { data: clientesData }, 
    ]  = await Promise.all([
      supabase
        .from("products")
        .select("id, name, price, thumbnail_url, destacado, ano, kilometros")
        .eq("dealership_id", dealershipId)
        .eq("destacado", true)
        .limit(8),

      supabase
        .from("products")
        .select("id, name, price, thumbnail_url, discount, ano, kilometros")
        .eq("dealership_id", dealershipId)
        .gt("discount", 0)
        .limit(12),

      supabase
        .from("clientes")
        .select("id, nombre, comentario, estrellas, photo_url")
        .eq("dealership_id", dealershipId)
        .order("created_at", { ascending: false })
        .limit(8),
        
    ]);


    const payload = {
      destacados: destacadosData || [],
      ofertas: ofertasData || [],
      clientes: clientesData || [],
    };


    const kb = new Blob([JSON.stringify(payload)]).size / 1024;
    console.log(`📦 Home payload: ${kb.toFixed(2)} KB`);
    

    saveCache(dealershipId, payload);
    setLocalVersion(dealershipId, dbVersion);

    setDestacados(payload.destacados);
    setOfertas(payload.ofertas);
    setClientes(payload.clientes);
    setLoading(false);
  };

  init();
}, [dealershipId, dealershipLoading]);


  return (
    <div className="home-page">
      {/* HERO */}
      <section className="home-hero">
  <Carousel onHasBanners={setHasBanners} />

  <div className="hero-overlay" />

  <div className="home-hero-content">
    <h1 className="home-hero-title">Bienvenido a Dromux Automotores</h1>
    <p className="home-hero-subtitle">
      Tu confianza, nuestro compromiso. Encuentra el vehículo perfecto con
      la mejor atención y precios imbatibles.
    </p>

    <div className="home-hero-cta">
      <Link to="/vehiculos" className="home-cta-btn primary">
        Explorar vehículos
      </Link>
      <Link to="/contacto" className="home-cta-btn secondary">
        Contactanos ahora
      </Link>
    </div>
  </div>
</section>


      {/* DESTACADOS */}
      <section className="home-featured">
        <div className="home-section-header">
          <h2>
            <Star size={32} /> Vehículos Destacados
          </h2>
          <Link to="/vehiculos" className="home-view-all">
            Ver todos →
          </Link>
        </div>

        <div className="home-products-grid horizontal auto-scroll-wrapper">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="home-card home-skeleton">
                <div className="home-skel-img"></div>
                <div className="home-skel-text"></div>
                <div className="home-skel-text short"></div>
              </div>
            ))
          ) : destacados.length === 0 ? (
            <p className="home-empty">
              No hay vehículos destacados por el momento
            </p>
          ) : (
            <div className="auto-scroll-track">
              {[...destacados, ...destacados].map((p, i) => (
                <Link
                  to={`/vehiculo/${p.id}`}
                  key={`${p.id}-${i}`}
                  className="home-card"
                >
                  <div className="home-card-img">
                    <img
                      src={p.thumbnail_url || "/placeholder-car.webp"}
                      alt={p.name}
                      loading="lazy"
                    />
                    {p.destacado && (
                      <div className="home-badge-featured">
                        Destacado
                      </div>
                    )}
                  </div>
                    <div className="home-card-body">
                      <div className="home-card-info">
                        <h3 className="home-card-title">{p.name}</h3>

                        <p className="home-card-detail">
                          <strong>Modelo:</strong> {p.ano || "—"}
                        </p>

                        <p className="home-card-detail">
                          <strong>Kilómetros:</strong>{" "}
                          {p.kilometros != null
                            ? `${Number(p.kilometros).toLocaleString("es-AR")} km`
                            : "0 km"}
                        </p>
                      </div>

                      <div className="home-card-price">
                        ${Number(p.price).toLocaleString("es-AR")}
                      </div>
                    </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CLIENTES */}
      <section className="home-clients">
        <div className="home-section-header">
          <h2>
            <Users size={32} /> Clientes que confiaron en nosotros
          </h2>
          {/*<Link to="/clientes" className="home-view-all">
            Ver todos →
          </Link>*/}
        </div>

        <div className="clients-carousel">
          {clientes.length === 0 ? (
            <p className="home-empty">Aún no hay reseñas de clientes</p>
          ) : (
            <div className="clients-grid auto-scroll-wrapper">
              <div className="auto-scroll-track reverse">
                {[...clientes, ...clientes].map((cliente, i) => (
                  <div
                    key={`${cliente.id}-${i}`}
                    className="client-card"
                  >
                    <div className="client-photo">
                      <img
                        src={
                          cliente.photo_url ||
                          "https://via.placeholder.com/80"
                        }
                        alt={cliente.nombre}
                      />
                    </div>
                    <h3 className="client-name">
                      {cliente.nombre}
                    </h3>
                    <p className="client-comentario">
                      {cliente.comentario || "Cliente satisfecho"}
                    </p>
                    <div className="client-stars">
                      {"★".repeat(cliente.estrellas || 5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
