import React, { useEffect, useMemo, useState, useRef } from "react";
import { X, Upload, Trash2, Star, Percent, Package, Loader2, CheckCircle, XCircle} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { deleteImagesFromStorage } from "../../utils/storage";
import { useDealership } from "../../hooks/useDealership";
import "./AgregarVehiculo.css";

const CATEGORIES_CACHE_TTL = 5 * 60 * 1000;
const MAX_PRODUCTS = 20;

/* =========================
   Cache helpers
========================= */
  function loadCategoriesCache(key) {
    if (!key) return null;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed?.ts || !parsed?.data) return null;
      if (Date.now() - parsed.ts > CATEGORIES_CACHE_TTL) return null;

      return parsed.data;
    } catch {
      return null;
    }
  }

  function saveCategoriesCache(key, data) {
    if (!key) return;

    try {
      localStorage.setItem(
        key,
        JSON.stringify({ ts: Date.now(), data })
      );
    } catch {}
  }

/* =========================
   Component
========================= */
export default function AgregarVehiculo({
  onSubmit,
  initialData = null,
  categories: categoriesProp = null,
  onClose,
}) {

  /* ---------- FORM STATE ---------- */
  const [form, setForm] = useState({
    name: initialData?.name || "",
    plate: initialData?.plate || "",
    description: initialData?.description || "",
    price: initialData?.price ?? "",
    cash_price: initialData?.cash_price ?? "",
    stock: initialData?.stock ?? 1,
    category: initialData?.category || "",
    subcategory: initialData?.subcategory || "",
    discount: initialData?.discount ?? 0,
    destacado: Boolean(initialData?.destacado),
    modelo: initialData?.modelo || "",
    ano: initialData?.ano || "",
    version: initialData?.version || "",
    kilometros: initialData?.kilometros ?? "",
    combustible: initialData?.combustible || "",
    motor: initialData?.motor || "",
    potencia: initialData?.potencia || "",
    puertas: initialData?.puertas || "",
    transmision: initialData?.transmision || "",
    color: initialData?.color || "",
    condicion: initialData?.condicion || "Usado",
    carroceria: initialData?.carroceria || "",
    traccion: initialData?.traccion || "",
    consumo_mix: initialData?.consumo_mixto || "",
    vin: initialData?.vin || "",
  });

  /* ---------- IMAGES ---------- */
  const [existingUrls, setExistingUrls] = useState(
  Array.isArray(initialData?.image_urls)
    ? [...initialData.image_urls]
    : []
);

const [newFiles, setNewFiles] = useState([]);
const [imagesToDelete, setImagesToDelete] = useState([]);
const [search, setSearch] = useState("");
const [vehicles, setVehicles] = useState([]);
const [plateSearch, setPlateSearch] = useState("");
const [vehicleResults, setVehicleResults] = useState([]);
const [selectedVehicle, setSelectedVehicle] = useState(null);


  /* ---------- UI ---------- */
  const [uploading, setUploading] = useState(false);
  const [uploadProgressPct, setUploadProgressPct] = useState(0);
  const [categories, setCategories] = useState(categoriesProp || []);
  const [errors, setErrors] = useState({});
  const categoriesLoadedRef = useRef(Boolean(categoriesProp));
  const { dealershipId, loading: dealershipLoading } = useDealership();
  const categoriesCacheKey = useMemo(() => {
    if (!dealershipId) return null;
    return `app_categories_${dealershipId}_v1`;
  }, [dealershipId]);

  useEffect(() => {
  if (initialData?.image_urls) {
    setExistingUrls([...initialData.image_urls]);
  }
}, [initialData]);

useEffect(() => {
  if (!initialData) return;

  setForm({
    name: initialData.name ?? "",
    description: initialData.description ?? "",
    price: initialData.price ?? "",
    cash_price: initialData.cash_price ?? "",
    stock: initialData.stock ?? 1,
    category: initialData.category ?? "",
    subcategory: initialData.subcategory ?? "",
    discount: initialData.discount ?? 0,
    destacado: Boolean(initialData.destacado),

    modelo: initialData.modelo ?? "",
    ano: initialData.ano ?? "",
    version: initialData.version ?? "",
    kilometros: initialData.kilometros ?? "",
    combustible: initialData.combustible ?? "",
    motor: initialData.motor ?? "",
    potencia: initialData.potencia ?? "",
    puertas: initialData.puertas ?? "",
    transmision: initialData.transmision ?? "",
    color: initialData.color ?? "",
    condicion: initialData.condicion ?? "Usado",
    carroceria: initialData.carroceria ?? "",
    traccion: initialData.traccion ?? "",
    consumo_mix: initialData.consumo_mixto ?? "",
    vin: initialData.vin ?? "",
    image_urls: initialData.image_urls ?? []
  });
}, [initialData]);

useEffect(() => {
  if (!dealershipId || search.length < 2) return;

  const load = async () => {
    const { data } = await supabase
      .from("vehicles")
      .select(`
        id,
        plate,
        products (
          id,
          name
        )
      `)
      .eq("dealership_id", dealershipId)
      .ilike("plate", `%${search}%`)
      .limit(10);

    setVehicles(data || []);
  };

  load();
}, [search, dealershipId]);

useEffect(() => {
  if (!initialData?.id || !dealershipId) return;

  const loadLinkedVehicle = async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, plate, brand, model, linked")
      .eq("dealership_id", dealershipId)
      .eq("product_id", initialData.id)
      .maybeSingle();

    if (!error && data) {
      setSelectedVehicle(data);
      setPlateSearch(data.plate);
    }
  };

  loadLinkedVehicle();
}, [initialData?.id, dealershipId]);


useEffect(() => {
  if (!dealershipId || plateSearch.length < 2) {
    setVehicleResults([]);
    return;
  }

  const searchVehicles = async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, plate, brand, model")
      .eq("dealership_id", dealershipId)
      .eq("linked", false) // 🔑 solo vehículos aún no vinculados
      .ilike("plate", `%${plateSearch}%`)
      .limit(10);

    if (!error) setVehicleResults(data || []);
  };

  searchVehicles();
}, [plateSearch, dealershipId]);


  /* =========================
     Load categories
  ========================= */
  useEffect(() => {
    if (dealershipLoading) return;
    if (!dealershipId) return;

    let mounted = true;

    const load = async () => {
      if (categoriesProp) {
        setCategories(categoriesProp);
        return;
      }

      const cached = loadCategoriesCache(categoriesCacheKey);
      if (cached) {
        setCategories(cached);
        return;
      }

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("dealership_id", dealershipId)
        .order("name");

      if (!mounted) return;

      if (error) {
        console.error(error);
        toast.error("Error cargando categorías");
        return;
      }

      setCategories(data || []);
      saveCategoriesCache(categoriesCacheKey, data || []);
    };

    load();
    return () => { mounted = false; };

  }, [ categoriesProp, dealershipId, dealershipLoading, categoriesCacheKey]);


  /* =========================
     Subcategories
  ========================= */
  const subcategoriesForSelected = useMemo(() => {
    const cat = categories.find(
      c => c.id === form.category || c.name === form.category
    );
    return Array.isArray(cat?.subcategories) ? cat.subcategories : [];
  }, [categories, form.category]);

  /* =========================
     Previews
  ========================= */
  const previews = useMemo(() => {
    const newPreviews = newFiles.map((file) =>
      URL.createObjectURL(file)
    );
    return [...existingUrls, ...newPreviews];
  }, [existingUrls, newFiles]);

  useEffect(() => {
    return () => {
      newFiles.forEach((file) =>
        URL.revokeObjectURL(file)
      );
    };
  }, [newFiles]);

  /* =========================
     Handlers
  ========================= */
  const handleField = (e) => {
    const { name, type, checked, value } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors(err => ({ ...err, [name]: null }));
  };

  const handleImageFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const MAX_MB = 5;
    const valid = files.filter(file => {
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten imágenes");
        return false;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error("Las imágenes no pueden superar 5MB");
        return false;
      }
      return true;
    });

    setNewFiles(prev => [...prev, ...valid]);
  };


  const removePreview = (index) => {
    const existingCount = existingUrls.length;

    if (index < existingCount) {
      const url = existingUrls[index];

      setImagesToDelete((prev) => [...prev, url]);
      setExistingUrls((prev) => prev.filter((_, i) => i !== index));
    } else {
      const newIndex = index - existingCount;
      setNewFiles((prev) => prev.filter((_, i) => i !== newIndex));
    }
  };

  /* =========================
     Validation
  ========================= */
  const validate = () => {
    const errs = {};

    if (!form.name.trim()) errs.name = "Nombre obligatorio";
    if (!form.price || Number(form.price) <= 0)
      errs.price = "Precio inválido";
    if (!form.category) errs.category = "Categoría obligatoria";

    // 🔴 VALIDACIÓN CLAVE
    if (!selectedVehicle && !initialData)
      errs.vehicle = "Debes vincular un vehículo por patente";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* =========================
     Upload images (Supabase)
  ========================= */
  const uploadNewFiles = async () => {
    const urls = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const path = `${dealershipId}/${Date.now()}_${uuidv4()}`;

      const { error } = await supabase
        .storage
        .from("products")
        .upload(path, file);

      if (error) throw error;

      const { data } = supabase
        .storage
        .from("products")
        .getPublicUrl(path);

      urls.push(data.publicUrl);
      setUploadProgressPct(
        Math.round(((i + 1) / newFiles.length) * 100)
      );
    }

    return urls;
  };

  const clean = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined
    )
  );



  /* =========================
   Submit
========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // 🚫 LIMITE DE PRODUCTOS (solo al crear)
    if (!initialData) {
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("dealership_id", dealershipId);

      if (error) {
        toast.error("No se pudo validar el límite de productos");
        return;
      }

      if (count >= MAX_PRODUCTS) {
        toast.error(`Límite alcanzado (${MAX_PRODUCTS} vehículos máximo)`);
        return;
      }
    }

    setUploading(true);

    try {
      // 1️⃣ subir imágenes nuevas
      let finalImageUrls = [...existingUrls];

      if (newFiles.length) {
        const uploaded = await uploadNewFiles();
        finalImageUrls = [...finalImageUrls, ...uploaded];
      }

      // 2️⃣ 🔥 BORRAR STORAGE (ANTES del update)
      if (imagesToDelete.length) {
        await deleteImagesFromStorage(imagesToDelete);
      }

      // 2️⃣ payload limpio
      const payload = clean({
        name: form.name.trim(),
        plate: selectedVehicle.plate,
        description: form.description || null,

        price: Number(form.price),
        cash_price: Number(form.cash_price || form.price),

        discount: Number(form.discount) || 0,
        stock: Number(form.stock) || 0,

        category: form.category,
        subcategory: form.subcategory || null,

        destacado: Boolean(form.destacado),

        modelo: form.modelo || null,
        ano: form.ano ? Number(form.ano) : null,
        version: form.version || null,
        kilometros: form.kilometros ? Number(form.kilometros) : null,
        combustible: form.combustible || null,
        motor: form.motor || null,
        potencia: form.potencia || null,
        puertas: form.puertas || null,
        transmision: form.transmision || null,
        color: form.color || null,
        condicion: form.condicion || null,
        carroceria: form.carroceria || null,
        traccion: form.traccion || null,
        consumo_mixto: form.consumo_mix || null,
        vin: form.vin || null,

        image_urls: finalImageUrls,
        updated_at: new Date().toISOString(),
      });

        if (initialData?.id) {
        await supabase
          .from("products")
          .update(payload)
          .eq("id", initialData.id)
          .eq("dealership_id", dealershipId);
      } else {
        // 1️⃣ crear producto
const { data: product, error } = await supabase
  .from("products")
  .insert({
    ...payload,
    dealership_id: dealershipId,
  })
  .select()
  .single();

if (error) throw error;

// 2️⃣ vincular vehicle existente
if (selectedVehicle) {
  const { error: linkError } = await supabase
    .from("vehicles")
    .update({
      product_id: product.id,
      linked: true,
    })
    .eq("id", selectedVehicle.id);

  if (linkError) throw linkError;
}


      }

      toast.success("Vehículo guardado correctamente");
      onClose?.();

    } catch (err) {
      console.error("❌ HANDLE SUBMIT ERROR:", err);
      toast.error("Error al guardar el vehículo");
    } finally {
      setUploading(false);
    }
  };


  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div className="ap-form-overlay" onClick={() => !uploading && onClose && onClose()}>
        <div className="ap-form-container" onClick={(e) => e.stopPropagation()}>
          <div className="ap-form-header">
            <h2 className="ap-form-title">
              <Package size={24} />
              {initialData ? "Editar Vehículo" : "Nuevo Vehículo"}
            </h2>
            <button onClick={() => !uploading && onClose && onClose()} className="ap-close-btn" aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="ap-product-form" noValidate>
            <div className="ap-form-grid">
              {/* Categoría y Subcategoría */}
<div className="ap-form-group">
  <label>Vincular vehículo por patente *</label>

  <input
    type="text"
    placeholder="Buscar patente y seleccionar"
    value={plateSearch}
    onChange={(e) => {
      setPlateSearch(e.target.value.toUpperCase());
      setSelectedVehicle(null);
    }}
  />

  {vehicleResults.length > 0 && !selectedVehicle && (
    <div className="plate-results">
      {vehicleResults.map((v) => (
        <div
          key={v.id}
          className="plate-item"
          onClick={() => {
            setSelectedVehicle(v);     // ✅ ACÁ está la función que faltaba
            setPlateSearch(v.plate);
            setVehicleResults([]);
          }}
        >
          <strong>{v.plate}</strong> — {v.brand} {v.model}
        </div>
      ))}
    </div>
  )}

  {selectedVehicle && (
    <p className="plate-selected">
      Vehículo seleccionado: <strong>{selectedVehicle.plate}</strong>
    </p>
  )}
</div>


              <div className="ap-form-group">
                <label>Categoría *</label>
                <select name="category" value={form.category} onChange={handleField} disabled={uploading}>
                  <option value="">Seleccionar categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id || c.name}>
                      {c.name ?? c}
                    </option>
                  ))}
                </select>
                {errors.category && <div className="ap-field-error">{errors.category}</div>}
              </div>

              <div className="ap-form-group">
                <label>Subcategoría</label>
                <select
                  name="subcategory"
                  value={form.subcategory}
                  onChange={handleField}
                  disabled={uploading || subcategoriesForSelected.length === 0}
                >
                  <option value="">(ninguna)</option>
                  {subcategoriesForSelected.map((s, i) => (
                    <option key={i} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock - visible y editable */}
              <div className="ap-form-group">
                <label>Stock (unidades disponibles)</label>
                <input
                  name="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={handleField}
                  placeholder="Ej: 1, 5, 10"
                  disabled={uploading}
                />
                <small style={{ color: "#666", fontSize: "0.9rem" }}>
                </small>
              </div>

              {/* Campos del vehículo */}
              <div className="ap-form-group">
                <label>Nombre / Título *</label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleField}
                  placeholder="Ej: Toyota Corolla XEI 2023"
                  disabled={uploading}
                />
                {errors.name && <div className="ap-field-error">{errors.name}</div>}
              </div>

              <div className="ap-form-group">
                <label>Modelo</label>
                <input
                  name="modelo"
                  type="text"
                  value={form.modelo}
                  onChange={handleField}
                  placeholder="Ej: Corolla, 208, Ranger"
                  disabled={uploading}
                />
              </div>

              <div className="ap-form-group">
                <label>Año</label>
                <input
                  name="ano"
                  type="number"
                  min="1900"
                  max="2030"
                  value={form.ano}
                  onChange={handleField}
                  placeholder="Ej: 2024"
                  disabled={uploading}
                />
              </div>

              <div className="ap-form-group">
                <label>Versión / Acabado</label>
                <input
                  name="version"
                  type="text"
                  value={form.version}
                  onChange={handleField}
                  placeholder="Ej: XEI, Allure, Limited"
                  disabled={uploading}
                />
              </div>

              <div className="ap-form-group">
                <label>Kilómetros</label>
                <input
                  name="kilometros"
                  type="number"
                  min="0"
                  value={form.kilometros}
                  onChange={handleField}
                  placeholder="Ej: 45000"
                  disabled={uploading}
                />
              </div>

              <div className="ap-form-group">
                <label>Tipo de combustible</label>
                <select name="combustible" value={form.combustible} onChange={handleField} disabled={uploading}>
                  <option value="">Seleccionar</option>
                  <option value="Nafta">Nafta</option>
                  <option value="Diésel">Diésel</option>
                  <option value="Híbrido">Híbrido</option>
                  <option value="Eléctrico">Eléctrico</option>
                  <option value="Híbrido Enchufable">Híbrido Enchufable</option>
                  <option value="GNC">GNC</option>
                </select>
              </div>

              <div className="ap-form-group">
                <label>Motor</label>
                <input
                  name="motor"
                  type="text"
                  value={form.motor}
                  onChange={handleField}
                  placeholder="Ej: 1.6L 16V, 2.0 Turbo"
                  disabled={uploading}
                />
              </div>

              <div className="ap-form-group">
                <label>Potencia</label>
                <input
                  name="potencia"
                  type="text"
                  value={form.potencia}
                  onChange={handleField}
                  placeholder="Ej: 123 CV, 170 HP"
                  disabled={uploading}
                />
              </div>

              <div className="ap-form-group">
                <label>Puertas</label>
                <select name="puertas" value={form.puertas} onChange={handleField} disabled={uploading}>
                  <option value="">Seleccionar</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              <div className="ap-form-group">
                <label>Transmisión</label>
                <select name="transmision" value={form.transmision} onChange={handleField} disabled={uploading}>
                  <option value="">Seleccionar</option>
                  <option value="Manual">Manual</option>
                  <option value="Automática">Automática</option>
                </select>
              </div>

              <div className="ap-form-group">
                <label>Color</label>
                <input
                  name="color"
                  type="text"
                  value={form.color}
                  onChange={handleField}
                  placeholder="Ej: Blanco Perla, Negro Obsidiana"
                  disabled={uploading}
                />
              </div>

              <div className="ap-form-group">
                <label>Condición</label>
                <select name="condicion" value={form.condicion} onChange={handleField} disabled={uploading}>
                  <option value="0km">0km</option>
                  <option value="Usado">Usado</option>
                </select>
              </div>

              <div className="ap-form-group">
                <label>Tipo de carrocería</label>
                <select name="carroceria" value={form.carroceria} onChange={handleField} disabled={uploading}>
                  <option value="">Seleccionar</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Sedán">Sedán</option>
                  <option value="SUV">SUV</option>
                  <option value="Pick-up">Pick-up</option>
                  <option value="Coupé">Coupé</option>
                  <option value="Station Wagon">Station Wagon</option>
                  <option value="Minivan">Minivan</option>
                  <option value="Van">Van</option>
                </select>
              </div>

              <div className="ap-form-group">
                <label>Tracción</label>
                <select name="traccion" value={form.traccion} onChange={handleField} disabled={uploading}>
                  <option value="">Seleccionar</option>
                  <option value="Delantera">Delantera</option>
                  <option value="Trasera">Trasera</option>
                  <option value="4x4">4x4</option>
                  <option value="AWD">AWD</option>
                  <option value="4WD">4WD</option>
                </select>
              </div>

              <div className="ap-form-group">
                <label>Consumo mixto</label>
                <input
                  name="consumo_mix"
                  type="text"
                  value={form.consumo_mix}
                  onChange={handleField}
                  placeholder="Ej: 14.5 km/l"
                  disabled={uploading}
                />
              </div>
              
              {/* Precio y descuento */}
              <div className="ap-form-group">
                <label>Precio (lista) *</label>
                <div className="ap-price-input-wrapper">
                  <span className="ap-currency">$</span>
                  <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleField} disabled={uploading} />
                </div>
                {errors.price && <div className="ap-field-error">{errors.price}</div>}
              </div>

              <div className="ap-form-group">
                <label>Precio contado / transferencia</label>
                <div className="ap-price-input-wrapper">
                  <span className="ap-currency">$</span>
                  <input name="cashPrice" type="number" min="0" step="0.01" value={form.cashPrice} onChange={handleField} disabled={uploading} />
                </div>
              </div>

              {/*<div className="ap-form-group">
                <label>Descuento (%)</label>
                <div className="ap-discount-input-wrapper">
                  <input name="discount" type="number" min="0" max="90" step="1" value={form.discount} onChange={handleField} disabled={uploading} />
                  <Percent size={18} className="ap-discount-icon" />
                </div>
              </div>*/}

              <div className="ap-form-group checkbox-group">
                <label className="ap-checkbox-label">
                  <input name="destacado" type="checkbox" checked={form.destacado} onChange={handleField} disabled={uploading} />
                  <Star size={16} className={`ap-star-icon ${form.destacado ? "filled" : ""}`} />
                  Destacado
                </label>
              </div>

              <div className="ap-form-group full-width">
                <label>Descripción</label>
                <textarea name="description" rows="4" value={form.description} onChange={handleField} disabled={uploading}></textarea>
              </div>

              {/* Imágenes */}
              <div className="ap-form-group full-width">
                <label>Imágenes ({previews.length})</label>
                <div className="ap-image-upload-area">
                  <input type="file" accept="image/*" multiple onChange={handleImageFiles} id="image-upload" className="ap-hidden-input" disabled={uploading} />
                  <label htmlFor="image-upload" className={`ap-upload-label ${uploading ? "disabled" : ""}`}>
                    {uploading ? (
                      <>
                        <Loader2 size={28} className="ap-spin" />
                        <span>Subiendo... {uploadProgressPct}%</span>
                      </>
                    ) : (
                      <>
                        <Upload size={28} />
                        <span>Click o arrastrá imágenes</span>
                        <small>JPG, PNG, WebP • Máx 5MB</small>
                      </>
                    )}
                  </label>

                  {previews.length > 0 && (
                    <div className="ap-image-preview-grid">
                      {previews.map((src, i) => (
                        <div key={i} className="ap-image-preview-item">
                          <img src={src} alt={`prev-${i}`} />
                          {!uploading && (
                            <button type="button" onClick={() => removePreview(i)} className="ap-remove-image-btn">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="ap-form-actions">
              <button type="button" className="ap-btn-cancel" onClick={() => !uploading && onClose && onClose()} disabled={uploading}>
                Cancelar
              </button>
              <button type="submit" className="ap-btn-submit" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 size={18} className="ap-spin" /> Guardando...
                  </>
                ) : initialData ? "Actualizar Vehículo" : "Crear Vehículo"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}