import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useDealership } from "../../hooks/useDealership";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import "./AdminBanner.css";

  // =========================
  // IMAGE OPTIMIZATION
  // =========================
  const resizeImage = (file, maxSize = 1920, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject("Error generando imagen");
            resolve(blob);
          },
          "image/webp",
          quality
        );
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

function AdminBanner() {
  const { dealershipId } = useDealership();

  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [banners, setBanners] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const MAX_IMAGES = 2;

  /* =========================
     FETCH BANNERS
  ========================= */
  useEffect(() => {
    if (!dealershipId) return;

    console.log("📥 [AdminBanner] Fetch banners");

    const fetchBanners = async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("dealership_id", dealershipId)
        .order("order");

      if (error) {
        toast.error("Error al cargar los banners");
        console.error("❌ Error cargando banners:", error);
        return;
      }

      setBanners(
        (data || []).map((b) => ({
          ...b,
          image: b.image_url, // mantiene JSX intacto
        }))
      );

      console.log("✅ Banners cargados:", data?.length || 0);
    };

    fetchBanners();
  }, [dealershipId]);

  /* =========================
     IMAGE SELECT
  ========================= */
  const handleImageChange = (e) => {
    if (banners.length >= MAX_IMAGES) {
      toast.warning("No puedes agregar más banners", {
        description: `El máximo permitido es ${MAX_IMAGES}. Elimina uno para subir otro.`,
      });
      e.target.value = ""; // limpia el input
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  /* =========================
     UPLOAD
  ========================= */
const handleUpload = async () => {
  if (!image || !dealershipId) {
    toast.warning("Selecciona una imagen primero");
    return;
  }

  if (banners.length >= MAX_IMAGES) {
    toast.error("Límite alcanzado", {
      description: `Solo se permiten hasta ${MAX_IMAGES} banners.`,
    });
    return;
  }

  const loadingToast = toast.loading("Subiendo banner...");

  try {
    const optimizedBlob = await resizeImage(image, 1920, 0.8);

    const path = `${dealershipId}/banner_${Date.now()}_${uuidv4()}.webp`;

    const { error: uploadError } = await supabase.storage
      .from("banners")
      .upload(path, optimizedBlob, {
        contentType: "image/webp",
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("banners").getPublicUrl(path);

    const maxOrder =
      banners.length > 0
        ? Math.max(...banners.map((b) => b.order))
        : -1;

    const { data: banner, error } = await supabase
      .from("banners")
      .insert({
        dealership_id: dealershipId,
        image_url: data.publicUrl,
        order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) throw error;

    setBanners((prev) =>
      [...prev, { ...banner, image: banner.image_url }].sort(
        (a, b) => a.order - b.order
      )
    );

    setImage(null);
    setPreviewUrl(null);
    document.querySelector("#banner-upload").value = "";

    toast.success("Banner subido correctamente");
  } catch (err) {
    console.error("❌ Error subiendo banner:", err);
    toast.error("Error al subir el banner", {
      description: "Intenta nuevamente en unos segundos.",
    });
  } finally {
    toast.dismiss(loadingToast);
  }
};

  /* =========================
     DELETE
  ========================= */
  const handleDelete = async (id, imageUrl) => {
    toast("¿Eliminar este banner?", {
      description: "Esta acción no se puede deshacer.",
      action: {
        label: "Eliminar",
        onClick: async () => {
          const loadingToast = toast.loading("Eliminando banner...");

          try {
            const path = imageUrl.split("/banners/")[1];
            if (path) {
              await supabase.storage.from("banners").remove([path]);
            }

            await supabase.from("banners").delete().eq("id", id);

            setBanners((prev) => prev.filter((b) => b.id !== id));

            toast.success("Banner eliminado");
          } catch (err) {
            console.error("❌ Error eliminando banner:", err);
            toast.error("Error al eliminar el banner");
          } finally {
            toast.dismiss(loadingToast);
          }
        },
      },
    });
  };

  /* =========================
     DRAG & DROP
  ========================= */
  const handleDragStart = (_, id) => setDraggingId(id);
  const handleDragEnd = () => setDraggingId(null);
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    if (draggingId === targetId) return;

    const updated = [...banners];
    const dragged = updated.find((b) => b.id === draggingId);
    const target = updated.find((b) => b.id === targetId);

    [dragged.order, target.order] = [target.order, dragged.order];

    await Promise.all([
      supabase.from("banners").update({ order: dragged.order }).eq("id", dragged.id),
      supabase.from("banners").update({ order: target.order }).eq("id", target.id),
    ]);

    setBanners(updated.sort((a, b) => a.order - b.order));

    console.log("🔀 Orden de banners actualizado");
    toast.success("Orden de banners actualizado");
    setDraggingId(null);
  };


  return (
    <>
      {/* Google Fonts - Quicksand */}
      <link
        href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="admin-banner-wrapper">
        <div className="admin-banner-card">
          <h2 className="banner-title">
            <svg className="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 10h18" />
            </svg>
            Gestión de Banners
          </h2>

          {/* Upload Section */}
          <div className="upload-section">
            <div className="images-counter">
              {banners.length} / {MAX_IMAGES} banners
            </div>
            <div className="file-upload-group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                id="banner-upload"
              />
              <label htmlFor="banner-upload" className="upload-btn glass">
                Seleccionar Imagen
              </label>
            </div>

            {previewUrl && (
              <div className="preview-box">
                <img src={previewUrl} alt="Previsualización" className="preview-img" />
                <p className="preview-label">Vista previa</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!image || banners.length >= MAX_IMAGES}
              className={`submit-btn glass ${
                !image || banners.length >= MAX_IMAGES ? "disabled" : ""
              }`}
            >
              Subir Banner
            </button>
          </div>

          {/* Lista de Banners */}
          <div className="banners-section">
            <p className="info-hint">
              Arrastra las tarjetas para cambiar el orden • {banners.length} banner
              {banners.length !== 1 ? "s" : ""}
            </p>

            {banners.length === 0 ? (
              <div className="empty-state">
                <p>No hay banners aún</p>
                <span>Sube el primero para comenzar</span>
              </div>
            ) : (
              <div className="banners-grid">
                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    className={`banner-item ${draggingId === banner.id ? "dragging" : ""}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, banner.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, banner.id)}
                  >
                    <img src={banner.image} alt="Banner" className="banner-img" />
                    <div className="overlay">
                      <span className="order-tag">#{banner.order + 1}</span>
                      <button
                        onClick={() => handleDelete(banner.id, banner.image)}
                        className="delete-btn glass"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminBanner;
