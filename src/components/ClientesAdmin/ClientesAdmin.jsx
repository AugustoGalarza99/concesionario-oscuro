import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { UserPlus, Trash2, Loader2, Edit,} from "lucide-react";
import { useDealership } from "../../hooks/useDealership";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import "./ClientesAdmin.css";

  /* =========================
    Helpers
  ========================= */
  const deleteImageFromStorage = async (photoUrl) => {
    if (!photoUrl) return;

    const path = photoUrl.split("/storage/v1/object/public/clientes/")[1];
    if (!path) return;

    const { error } = await supabase
      .storage
      .from("clientes")
      .remove([path]);

    if (error) {
      console.error("Error borrando imagen:", error);
    }
  };

  const resizeImage = (file, maxSize = 512, quality = 0.75) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Mantener proporción
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject("Error al comprimir imagen");
            resolve(blob);
          },
          "image/webp", // 👉 formato moderno y liviano
          quality // 👉 calidad 0.7–0.8 es perfecto para fotos de perfil
        );
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

/* =========================
   Component
========================= */
export default function ClientesAdmin() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const { dealershipId, loading: dealershipLoading } = useDealership();
  const { isAdmin, isSeller } = useAuth();

  const [formData, setFormData] = useState({
    id: null,
    nombre: "",
    comentario: "",
    estrellas: 5,
    photo: null,
    photo_url: "",
    created_at: null,
  });

  /* =========================
     Fetch clientes
  ========================= */
  useEffect(() => {
    if (dealershipLoading || !dealershipId) return;

    const fetchClientes = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("dealership_id", dealershipId)
        .order("created_at", { ascending: false })
        .limit(8);

      if (!error) setClientes(data || []);
      setLoading(false);
    };

    fetchClientes();
  }, [dealershipId, dealershipLoading]);

  /* =========================
     Handlers
  ========================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFormData((p) => ({ ...p, photo: e.target.files[0] }));
    }
  };

  /* =========================
     Submit
  ========================= */
  const MAX_CLIENTES = 8;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin && !isSeller) {
      toast.error("No tenés permisos para modificar testimonios");
      return;
    }
    
  // 🚫 Bloqueo si ya hay 8 y no está editando
    if (!editing && clientes.length >= MAX_CLIENTES) {
      toast.warning("Límite alcanzado", {
        description: "Solo puedes tener 8 testimonios activos. Elimina uno para agregar otro.",
      });
      return;
    }

  if (!formData.nombre || !formData.comentario) {
    toast.error("Campos obligatorios", {
      description: "Nombre y comentario son requeridos",
    });
    return;
  }

    setUploading(true);

    try {
      let photo_url = formData.photo_url;

      // 📤 Subir nueva imagen
      if (formData.photo) {
        // 🔥 Optimizar imagen antes de subir
        console.log("🖼️ Imagen original:", formData.photo.size / 1024, "KB");

        const optimizedBlob = await resizeImage(formData.photo, 512, 0.75);

        console.log("✅ Imagen optimizada:", optimizedBlob.size / 1024, "KB");

        const filePath = `${dealershipId}/${Date.now()}.webp`;

        const { error: uploadError } = await supabase
          .storage
          .from("clientes")
          .upload(filePath, optimizedBlob, {
            contentType: "image/webp",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase
          .storage
          .from("clientes")
          .getPublicUrl(filePath);

        photo_url = data.publicUrl;

        // 🧹 borrar imagen vieja si estaba editando
        if (editing && formData.photo_url) {
          await deleteImageFromStorage(formData.photo_url);
        }
      }

      const payload = {
        nombre: formData.nombre.trim(),
        comentario: formData.comentario.trim(),
        estrellas: Number(formData.estrellas),
        photo_url,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        toast.promise(
          async () => {
            await supabase
              .from("clientes")
              .update(payload)
              .eq("id", formData.id)
              .eq("dealership_id", dealershipId);

            setClientes((prev) =>
              prev.map((c) =>
                c.id === formData.id ? { ...c, ...payload } : c
              )
            );
          },
          {
            loading: "Actualizando testimonio...",
            success: "Testimonio actualizado correctamente",
            error: "Error al actualizar el testimonio",
          }
        );
      }else {
        const { data } = await supabase
          .from("clientes")
          .insert({
            ...payload,
            dealership_id: dealershipId,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        setClientes((prev) => [data, ...prev].slice(0, 8));
        toast.success("Testimonio agregado", {
          description: "El nuevo testimonio ya es visible en la lista",
        });
      }

      setFormData({
        id: null,
        nombre: "",
        comentario: "",
        estrellas: 5,
        photo: null,
        photo_url: "",
        created_at: null,
      });
      setEditing(false);

    } catch (err) {
      console.error("Error guardando:", err);
      alert("Error al guardar");
    } finally {
      setUploading(false);
    }
  };

  /* =========================
     Edit / Delete
  ========================= */
  const handleEdit = (cliente) => {
    setFormData({
      id: cliente.id,
      nombre: cliente.nombre,
      comentario: cliente.comentario,
      estrellas: cliente.estrellas,
      photo: null,
      photo_url: cliente.photo_url || "",
      created_at: cliente.created_at,
    });
    setEditing(true);

    toast.info("Modo edición activado", {
      description: `Editando testimonio de ${cliente.nombre}`,
    });
  };

  const handleDelete = (cliente) => {
    if (!isAdmin) {
      toast.error("Solo un administrador puede eliminar testimonios");
      return;
    }
    toast(
      (t) => (
        <div className="toast-confirm">
          <strong>¿Eliminar testimonio?</strong>
          <p>
            Este testimonio de <b>{cliente.nombre}</b> se eliminará
            permanentemente.
          </p>

          <div className="toast-actions">
            <button
              className="toast-btn cancel"
              onClick={() => toast.dismiss(t)}
            >
              Cancelar
            </button>

            <button
              className="toast-btn delete"
              onClick={async () => {
                toast.dismiss(t);

                toast.promise(
                  async () => {
                    await deleteImageFromStorage(cliente.photo_url);
                    await supabase
                      .from("clientes")
                      .delete()
                      .eq("id", cliente.id)
                      .eq("dealership_id", dealershipId);

                    setClientes((prev) =>
                      prev.filter((c) => c.id !== cliente.id)
                    );
                  },
                  {
                    loading: "Eliminando...",
                    success: "Testimonio eliminado",
                    error: "Error al eliminar",
                  }
                );
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };


  return (
    <div className="clientes-admin-page">
      <h1 className="admin-title">
        <UserPlus size={32} /> Gestión de Testimonios de Clientes
      </h1>

      {/* Formulario centrado */}
      <div className="cliente-form-wrapper">
        <div className="cliente-form-container">
          <h2>{editing ? "Editar Testimonio" : "Agregar Nuevo Testimonio"}</h2>
          <form onSubmit={handleSubmit} className="cliente-form">
            <div className="form-group">
              <label>Nombre del cliente *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: María López"
                required
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label>Comentario / Testimonio *</label>
              <textarea
                name="comentario"
                value={formData.comentario}
                onChange={handleChange}
                placeholder="¿Qué le pareció su experiencia con nosotros?"
                rows="5"
                required
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label>Calificación</label>
              <select
                name="estrellas"
                value={formData.estrellas}
                onChange={handleChange}
                disabled={uploading}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} ★
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Foto del cliente (opcional)</label>
              {formData.photoURL && !formData.photo && (
                <div className="current-photo">
                  <img src={formData.photoURL} alt="Foto actual" />
                  <small>Foto actual</small>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>

            <button type="submit" className="btn-submit" disabled={uploading || (!editing && clientes.length >= 8)}>
              {uploading ? (
                <>
                  <Loader2 size={20} className="spin" /> Guardando...
                </>
              ) : !editing && clientes.length >= 8 ? (
                "Límite de testimonios alcanzado"
              ) : editing ? (
                "Actualizar Testimonio"
              ) : (
                "Agregar Testimonio"
              )}
            </button>

            {editing && (
              <button
                type="button"
                className="btn-cancel-edit"
                onClick={() => {
                  setFormData({
                    id: null,
                    nombre: "",
                    comentario: "",
                    estrellas: 5,
                    photo: null,
                    photoURL: "",
                  });
                  setEditing(false);
                  toast.info("Edición cancelada");
                }}
              >
                Cancelar edición
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Lista */}
      <div className="clientes-list">
        <h2>Testimonios actuales ({clientes.length}/8)</h2>
        {loading ? (
          <div className="loading">Cargando...</div>
        ) : clientes.length === 0 ? (
          <p className="no-data">Aún no hay testimonios</p>
        ) : (
          <div className="clientes-grid">
            {clientes.map((cliente) => (
              <div key={cliente.id} className="cliente-card">
                <div className="cliente-photo">
                  <img
                    src={cliente.photo_url || "https://via.placeholder.com/80"}
                    alt={cliente.nombre}
                  />
                </div>
                <h3>{cliente.nombre}</h3>
                <div className="cliente-stars">
                  {"★".repeat(cliente.estrellas)}
                  {"☆".repeat(5 - cliente.estrellas)}
                </div>
                <p className="cliente-comentario">{cliente.comentario}</p>
                <div className="cliente-actions">
                  <button className="btn-edit" onClick={() => handleEdit(cliente)}>
                    <Edit size={16} /> Editar
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(cliente)}>
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}