import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { useDealership } from "../../hooks/useDealership";
import "./Carousel.css";

/* =========================
   LocalStorage helpers
========================= */
const loadCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

/* =========================
   Component
========================= */
function Carousel({ onHasBanners }) {
  const { dealershipId } = useDealership();

  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  /* =========================
     Load banners (VERSIONED)
  ========================= */
  /* =========================
   Load banners (VERSIONED + notify Home)
========================= */
  useEffect(() => {
    if (!dealershipId) return;

    const loadBanners = async () => {
      console.log("🎠 [Carousel] Init");

      setLoading(true);

      /* 1️⃣ versión */
      const { data: versionRow, error: versionError } = await supabase
        .from("dealership_versions")
        .select("banners_version")
        .eq("dealership_id", dealershipId)
        .single();

      if (versionError) {
        console.warn("⚠️ [Carousel] No version, no banners");
        setSlides([]);
        setLoading(false);
        return;
      }

      const version = versionRow?.banners_version || 0;
      const cacheKey = `carousel_banners:${dealershipId}:${version}`;

      /* 2️⃣ cache */
      const cached = loadCache(cacheKey);
      if (cached) {
        console.log("📦 [Carousel] Cache hit");
        setSlides(cached);
        setLoading(false);
        return;
      }

      /* 3️⃣ DB */
      const { data, error } = await supabase
        .from("banners")
        .select("id, image_url, order")
        .eq("dealership_id", dealershipId)
        .order("order");

      if (error || !data?.length) {
        console.log("🚫 [Carousel] Sin banners");
        setSlides([]);
        setLoading(false);
        return;
      }

      const normalized = data.map((b) => ({
        id: b.id,
        image: b.image_url,
      }));

      setSlides(normalized);
      saveCache(cacheKey, normalized);

      console.log("✅ [Carousel] Banners cargados:", normalized.length);
      setLoading(false);
    };

    loadBanners();
  }, [dealershipId]);



  /* =========================
     Autoplay
  ========================= */
  useEffect(() => {
    if (slides.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(intervalRef.current);
  }, [slides]);

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % slides.length);

  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  if (loading) {
    return <div className="carousel skeleton" />;
  }

  if (!slides.length) {
    return null; // 🔥 NO hay banners → no existe el carousel
  }

  return (
    <div className="carousel">
      <div
        className="carousel-track"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div className="carousel-slide" key={slide.id}>
            <img
              src={slide.image}
              alt="Banner"
              loading="lazy"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/*{slides.length > 1 && (
        <>
          <button className="carousel-btn prev" onClick={prevSlide}>
            ‹
          </button>
          <button className="carousel-btn next" onClick={nextSlide}>
            ›
          </button>

          <div className="carousel-dots">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`dots ${i === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(i)}
              />
            ))}
          </div>
        </>
      )}*/}
    </div>
  );
}

export default Carousel;
