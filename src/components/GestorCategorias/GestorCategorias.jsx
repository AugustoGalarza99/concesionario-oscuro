import React, { useEffect, useState } from "react";
import "./GestorCategorias.css";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useDealership } from "../../hooks/useDealership";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { Tag, Plus, Trash2, Edit, ChevronDown, ChevronRight, CheckCircle, XCircle, ChevronLeftIcon} from "lucide-react";

/* ---------- Cache ---------- */
const CACHE_TTL = 5 * 60 * 1000;
const nowTs = () => Date.now();

const loadCache = (cacheKey) => {
  if (!cacheKey) return null;

  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.ts || !parsed?.data) return null;
    if (nowTs() - parsed.ts > CACHE_TTL) return null;

    return parsed.data;
  } catch {
    return null;
  }
};

const saveCache = (cacheKey, data) => {
  if (!cacheKey) return;

  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ ts: nowTs(), data })
    );
  } catch {}
};


export default function GestorCategorias() {
  const navigate = useNavigate();

  /* ---------- State ---------- */
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState(null);
  const [newSubByCat, setNewSubByCat] = useState({});
  const [editingSub, setEditingSub] = useState({});
  const [expanded, setExpanded] = useState({});
  const { isAdmin, isSeller } = useAuth();
  const { dealershipId, loading: dealershipLoading } = useDealership();

  const cacheKey = dealershipId
    ? `gestor_categories_${dealershipId}_v1`
    : null;


  /* ---------- Init ---------- */
  useEffect(() => {
    if (dealershipLoading || !dealershipId) return;
    fetchCategories(false);
  }, [dealershipLoading, dealershipId]);

  /* ---------- Fetch ---------- */
  const fetchCategories = async (force = false) => {
    setLoading(true);
    try {
      if (!force) {
        const cached = loadCache();
        if (cached) {
          setCategories(cached);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("dealership_id", dealershipId)
        .order("name", { ascending: true });

      if (error) throw error;

      setCategories(data);
      saveCache(data);
    } catch (err) {
      console.error(err);
      toast.error("Error cargando categorías");
    } finally {
      setLoading(false);
    }
  };

  const forceReload = async () => {
    await fetchCategories(true);
    toast.info("Categorías recargadas");
  };

  /* ---------- Create ---------- */
  const handleCreateCategory = () => {
    const name = newCatName.trim();
    if (!name) return pushToast("Nombre vacío", "error");

    confirmToast({
      title: "Crear categoría",
      description: `Crear "${name}"?`,
      onConfirm: async () => {
        try {
          const { data, error } = await supabase
            .from("categories")
            .insert({
              name,
              subcategories: [],
              dealership_id: dealershipId,
            })
            .select()
            .single();

          if (error) throw error;

          const updated = [...categories, data].sort((a, b) =>
            a.name.localeCompare(b.name)
          );

          setCategories(updated);
          saveCache(updated);
          setNewCatName("");

          toast.success("Categoría creada correctamente");
        } catch (err) {
          toast.error("Error creando categoría");
        }
      },
    });
  };

  /* ---------- Edit Category ---------- */
  const handleSaveEditCategory = () => {
    if (!editingCat?.name?.trim()) return;

    confirmToast({
      title: "Guardar cambios",
      description: `Actualizar categoría "${editingCat.name}"?`,
      onConfirm: async () => {
        try {
          await supabase
            .from("categories")
            .update({ name: editingCat.name })
            .eq("id", editingCat.id)
            .eq("dealership_id", dealershipId);

          const updated = categories.map((c) =>
            c.id === editingCat.id ? { ...c, name: editingCat.name } : c
          );

          setCategories(updated);
          saveCache(updated);
          setEditingCat(null);

          toast.success("Categoría actualizada");
        } catch {
          toast.error("Error actualizando categoría");
        }
      },
    });
  };

  /* ---------- Subcategories ---------- */
  const keyForSub = (catId, idx) => `${catId}|${idx}`;

  const handleAddSub = (catId) => {
    const value = (newSubByCat[catId] || "").trim();
    if (!value) return;

    confirmToast({
      title: "Agregar subcategoría",
      description: `Agregar "${value}"?`,
      onConfirm: async () => {
        try {
          const cat = categories.find((c) => c.id === catId);
          const subs = [...(cat.subcategories || []), value];

          await supabase
            .from("categories")
            .update({ subcategories: subs })
            .eq("id", catId)
            .eq("dealership_id", dealershipId);

          setCategories(
            categories.map((c) =>
              c.id === catId ? { ...c, subcategories: subs } : c
            )
          );

          saveCache(categories);
          setNewSubByCat((s) => ({ ...s, [catId]: "" }));

          toast.success("Subcategoría agregada");
        } catch {
          toast.error("Error agregando subcategoría");
        }
      },
    });
  };

  /* ---------- Delete ---------- */
  const handleDeleteCategory = (cat) => {
    if (!isAdmin) {
      toast.error("No tenés permisos para eliminar categorías");
      return;
    }
    confirmToast({
      title: "Eliminar categoría",
      description: `Eliminar "${cat.name}" permanentemente?`,
      onConfirm: async () => {
        try {
          await supabase
            .from("categories")
            .delete()
            .eq("id", cat.id)
            .eq("dealership_id", dealershipId);

          const updated = categories.filter((c) => c.id !== cat.id);
          setCategories(updated);
          saveCache(updated);

          toast.success("Categoría eliminada");
        } catch {
          toast.error("Error eliminando categoría");
        }
      },
    });
  };


  const handleDeleteSubcategory = (catId, subIndex) => {
    if (!isAdmin) {
      toast.error("No tenés permisos para eliminar subcategorías");
      return;
    }
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    const subName = cat.subcategories[subIndex];

    confirmToast({
      title: "Eliminar subcategoría",
      description: `Eliminar "${subName}" permanentemente?`,
      onConfirm: async () => {
        try {
          const updatedSubs = cat.subcategories.filter(
            (_, idx) => idx !== subIndex
          );

          await supabase
            .from("categories")
            .update({ subcategories: updatedSubs })
            .eq("id", catId)
            .eq("dealership_id", dealershipId);

          const updatedCategories = categories.map(c =>
            c.id === catId ? { ...c, subcategories: updatedSubs } : c
          );

          setCategories(updatedCategories);
          saveCache(updatedCategories);

          toast.success("Subcategoría eliminada");
        } catch (err) {
          console.error(err);
          toast.error("Error eliminando subcategoría");
        }
      },
    });
  };


  const handleSaveEditSubcategory = async () => {
    const { catId, index, value } = editingSub;
    if (!value?.trim()) return;

    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    setLoading(true);

    try {
      const updatedSubs = [...cat.subcategories];
      updatedSubs[index] = value.trim();

      const { error } = await supabase
        .from("categories")
        .update({ subcategories: updatedSubs })
        .eq("id", catId)
        .eq("dealership_id", dealershipId);

      if (error) throw error;

      const updatedCategories = categories.map(c =>
        c.id === catId ? { ...c, subcategories: updatedSubs } : c
      );

      setCategories(updatedCategories);
      saveCache(updatedCategories);
      setEditingSub({});
      toast.success("Subcategoría actualizada");
    } catch (err) {
      console.error(err);
      toast.error("Error actualizando subcategoría");
    } finally {
      setLoading(false);
    }
  };

  
  const confirmToast = ({ title, description, onConfirm }) => {
  toast.custom((t) => (
    <div className="toast-confirm">
      <strong>{title}</strong>
      <p>{description}</p>

      <div className="toast-actions">
        <button
          className="toast-btn cancel"
          onClick={() => toast.dismiss(t)}
        >
          Cancelar
        </button>

        <button
          className="toast-btn confirm"
          onClick={() => {
            toast.dismiss(t);
            onConfirm();
          }}
        >
          Confirmar
        </button>
      </div>
    </div>
  ), { duration: Infinity });
};


  /* ---------- Render ---------- */
    return (
    <>
      <div className="gc-container">
        <div className="gc-card">
          {/* Header */}
          <div className="gc-header">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                className="back-button"
                onClick={() => navigate("/admin/productos")}
                title="Volver"
              >
                <ChevronLeftIcon />
              </button>
              <h2 className="gc-title">
                <Tag className="gc-title-icon" /> Gestor de Categorías
              </h2>
            </div>
            <p className="gc-sub">Organiza categorías y subcategorías</p>
          </div>

          {/* Actions */}
          <div className="gc-actions">
            <div className="gc-new-form">
              <input
                className="gc-input"
                placeholder="Nueva categoría (ej: Peugeot)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <button className="btn-primary" onClick={handleCreateCategory}>
                <Plus size={16} /> Crear
              </button>
              <button
                className="gc-btn-secondary"
                onClick={forceReload}
                title="Recargar categorías"
              >
                Recargar
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="gc-body">
            {loading ? (
              <div className="gc-loading">Cargando categorías…</div>
            ) : categories.length === 0 ? (
              <div className="gc-empty">
                <Tag size={48} />
                <h3>No hay categorías</h3>
                <p>Crea tu primera categoría raíz</p>
              </div>
            ) : (
              <div className="gc-grid">
                {categories.map((cat) => (
                  <div key={cat.id} className="gc-card-cat">
                    {/* Card top */}
                    <div className="gc-card-top">
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div className="gc-avatar">
                          <Tag size={18} />
                        </div>
                        <div>
                          {editingCat?.id === cat.id ? (
                            <input
                              className="gc-edit-input"
                              value={editingCat.name}
                              onChange={(e) =>
                                setEditingCat({ ...editingCat, name: e.target.value })
                              }
                            />
                          ) : (
                            <div className="gc-cat-name">{cat.name}</div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="gc-card-actions">
                        {editingCat?.id === cat.id ? (
                          <>
                            <button
                              className="btn-primary small"
                              onClick={handleSaveEditCategory}
                            >
                              Guardar
                            </button>
                            <button
                              className="gc-btn-secondary small"
                              onClick={() => setEditingCat(null)}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="icon-btn"
                              onClick={() => setEditingCat(cat)}
                              title="Editar"
                            >
                              <Edit size={14} />
                            </button>

                            <button
                              className="icon-btn danger"
                              onClick={() => handleDeleteCategory(cat)}
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        <button
                          className="icon-toggle"
                          onClick={() =>
                            setExpanded((s) => ({ ...s, [cat.id]: !s[cat.id] }))
                          }
                          title="Mostrar subcategorías"
                        >
                          {expanded[cat.id] ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Subcategories */}
                    {expanded[cat.id] && (
                      <div className="gc-subsection">
                        <div className="gc-sub-list">
                          {(cat.subcategories || []).map((sub, idx) => (
                            <div key={idx} className="gc-sub-item">
                              {editingSub.catId === cat.id && editingSub.index === idx ? (
                                <input
                                  className="gc-edit-input"
                                  value={editingSub.value}
                                  autoFocus
                                  onChange={(e) =>
                                    setEditingSub({ ...editingSub, value: e.target.value })
                                  }
                                />
                              ) : (
                                <span className="gc-sub-text">{sub}</span>
                              )}
                                <div className="gc-sub-actions">
                                {editingSub.catId === cat.id && editingSub.index === idx ? (
                                  <>
                                    <button
                                      className="icon-btn"
                                      title="Guardar"
                                      onClick={handleSaveEditSubcategory}
                                    >
                                      <CheckCircle size={14} />
                                    </button>
                                    <button
                                      className="icon-btn"
                                      title="Cancelar"
                                      onClick={() => setEditingSub({})}
                                    >
                                      <XCircle size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      className="icon-btn"
                                      title="Editar subcategoría"
                                      onClick={() =>
                                        setEditingSub({
                                          catId: cat.id,
                                          index: idx,
                                          value: sub,
                                        })
                                      }
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      className="icon-btn danger"
                                      title="Eliminar subcategoría"
                                      onClick={() =>
                                        handleDeleteSubcategory(cat.id, idx)
                                      }
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="gc-sub-add">
                          <input
                            className="gc-input"
                            placeholder="Agregar subcategoría (ej: 207)"
                            value={newSubByCat[cat.id] || ""}
                            onChange={(e) =>
                              setNewSubByCat((x) => ({
                                ...x,
                                [cat.id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            className="btn-primary"
                            onClick={() => handleAddSub(cat.id)}
                          >
                            <Plus size={14} /> Agregar
                          </button>
                        </div>
                      </div>
                    )}
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