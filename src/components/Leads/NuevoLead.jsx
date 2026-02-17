import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { X, Save, User, Phone, Car, FileText } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useDealership } from "../../hooks/useDealership";
import "./NuevoLead.css";

export default function NuevoLead({ onClose, onSaved, initialData }) {
  const { user, profile } = useAuth();
  const { dealershipId } = useDealership();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    vehicle_label: "",
    notes: "",
    status: "Nuevo",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  /* =========================
     LOAD DATA FOR EDIT
  ========================= */
  useEffect(() => {
    if (initialData) {
      setForm({
        full_name: initialData.full_name || "",
        phone: initialData.phone || "",
        vehicle_label: initialData.vehicle_label || "",
        notes: initialData.notes || "",
        status: initialData.status || "Nuevo",
      });
    }
  }, [initialData]);

  /* =========================
     VALIDATION
  ========================= */
  const validate = () => {
    const errs = {};

    if (!form.full_name.trim()) errs.full_name = "Nombre obligatorio";
    if (!form.phone.trim()) errs.phone = "Teléfono obligatorio";
    if (!form.vehicle_label.trim())
      errs.vehicle_label = "Vehículo obligatorio";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    const payload = {
      ...form,
      seller_id: user.id,
      seller_name: profile?.name || profile?.full_name || user.email,
      dealership_id: dealershipId,
      updated_at: new Date().toISOString(),
    };


    const query = initialData?.id
      ? supabase.from("leads").update(payload).eq("id", initialData.id)
      : supabase.from("leads").insert(payload);

    const { error } = await query;

    setLoading(false);

    if (error) {
      console.error("Error guardando lead:", error);
      return;
    }

    onSaved?.();
    onClose();
  };

  return (
    <div className="lead-modal-overlay">
      <div className="lead-modal">
        {/* HEADER */}
        <header className="lead-modal-header">
          <h3>{initialData ? "Editar Lead" : "Nuevo Lead"}</h3>
          <button onClick={onClose} className="icon-btn close">
            <X />
          </button>
        </header>

        {/* FORM */}
        <div className="lead-form">
          {/* NOMBRE */}
          <div className="form-group">
            <label>Nombre completo</label>
            <div className="input-icon">
              <User size={16} />
              <input
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                placeholder="Juan Pérez"
              />
            </div>
            {errors.full_name && <span className="error">{errors.full_name}</span>}
          </div>

          {/* TELÉFONO */}
          <div className="form-group">
            <label>Teléfono</label>
            <div className="input-icon">
              <Phone size={16} />
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                placeholder="+54 9 11 1234 5678"
              />
            </div>
            {errors.phone && <span className="error">{errors.phone}</span>}
          </div>

          {/* VEHÍCULO */}
          <div className="form-group">
            <label>Vehículo de interés</label>
            <div className="input-icon">
              <Car size={16} />
              <input
                value={form.vehicle_label}
                onChange={(e) =>
                  setForm({ ...form, vehicle_label: e.target.value })
                }
                placeholder="Corolla 2022"
              />
            </div>
            {errors.vehicle_label && (
              <span className="error">{errors.vehicle_label}</span>
            )}
          </div>

          {/* ESTADO */}
          <div className="form-group">
            <label>Estado</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value })
              }
            >
              <option value="Nuevo">Nuevo</option>
              <option value="En negociación">Negociación</option>
              <option value="Vendido">Vendido</option>
              <option value="Perdido">Perdido</option>
            </select>
          </div>

          {/* NOTAS */}
          <div className="form-group">
            <label>Observaciones</label>
            <div className="input-icon textarea">
              <FileText size={16} />
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
                placeholder="Interesado en financiación..."
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="lead-modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary"
          >
            <Save size={16} />
            {loading ? "Guardando..." : "Guardar Lead"}
          </button>
        </footer>
      </div>
    </div>
  );
}
