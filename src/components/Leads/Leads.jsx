import { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { Search, Edit, Trash2, MessageCircle, User, Car, Plus} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./Leads.css";
import NuevoLead from "./NuevoLead";

const PAGE_SIZE = 10;

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [editingLead, setEditingLead] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // 🧠 cache en memoria
  const cacheRef = useRef({});

  const fetchLeads = async () => {
    const cacheKey = `${page}_${searchTerm}`;

    if (cacheRef.current[cacheKey]) {
      console.log("🧠 Cache hit", cacheKey);
      setLeads(cacheRef.current[cacheKey].data);
      setTotalCount(cacheRef.current[cacheKey].count);
      return;
    }

    setLoading(true);

    if (!user) return;

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    console.log("📡 Fetch DB", { page, searchTerm });

    let query = supabase
      .from("leads")
      .select(
        `
        id,
        full_name,
        phone,
        vehicle_label,
        status,
        notes,
        created_at
        `,
        { count: "exact" }
      )
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (searchTerm.trim()) {
      query = query.or(
        `
        full_name.ilike.%${searchTerm}%,
        vehicle_label.ilike.%${searchTerm}%,
        notes.ilike.%${searchTerm}%
        `
      );
    }

    const { data, count, error } = await query;

    if (!error) {
      cacheRef.current[cacheKey] = {
        data,
        count
      };

      console.log("✅ DB → cache", data.length);

      setLeads(data || []);
      setTotalCount(count || 0);
    } else {
      console.error(error);
    }

    setLoading(false);
  };

  const openNewLead = () => {
    setEditingLead({}); // objeto vacío = nuevo lead
  };

  const openEditLead = (lead) => { setEditingLead(lead); };

  useEffect(() => {
    fetchLeads();
  }, [page, searchTerm]);

  const deleteLead = async (lead) => {
    await supabase.from("leads").delete().eq("id", lead.id);
    cacheRef.current = {}; // invalidamos cache
    fetchLeads();
    setConfirm(null);
  };

  const updateLeadStatus = async (leadId, status) => {
    await supabase
      .from("leads")
      .update({ status, updated_at: new Date() })
      .eq("id", leadId);

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, status } : l
      )
    );
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const statusClass = (status) =>
    status
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_");

  return (
    <div className="gestor-container">
      <div className="gestor-card">
        {/* HEADER */}
        <div className="gestor-header">
          <h2 className="gestor-title">
            <User className="title-icon" />
            Gestión de Leads
          </h2>
          <p className="gestor-subtitle">
            Seguimiento comercial inteligente
          </p>
        </div>

        {/* SEARCH + BUTTON */}
        <div className="leads-toolbar">
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, vehículo o notas..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="search-input"
            />
          </div>

          <button className="btn-primary" onClick={openNewLead}>
            <Plus size={18} />
            Nuevo Lead
          </button>
        </div>

        {/* TABLE */}
        <div className="vehicles-table-wrapper">
          <table className="vehicles-table leads-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Interés</th>
                <th>Estado</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  {/* LEAD */}
                  <td>
                    <div className="lead-cell">
                      <User size={18} className="lead-icon" />
                      <div className="lead-info">
                        <span className="lead-name">{lead.full_name}</span>
                        <span className="lead-phone">{lead.phone}</span>
                      </div>
                    </div>
                  </td>

                  {/* INTERÉS */}
                  <td>
                    <div className="interest-cell">
                      <Car size={16} />
                      <span>{lead.vehicle_label || "Sin interés"}</span>
                    </div>
                  </td>

                  {/* ESTADO */}
                  <td>
                    <select
                      className={`status-select ${statusClass(lead.status)}`}
                      value={lead.status}
                      onChange={(e) =>
                        updateLeadStatus(lead.id, e.target.value)
                      }
                    >
                      <option value="Nuevo">Nuevo</option>
                      <option value="En negociación">En negociación</option>
                      <option value="Vendido">Vendido</option>
                      <option value="Perdido">Perdido</option>
                    </select>
                  </td>

                  {/* ACCIONES */}
                  <td>
                    <div className="actions-cell">
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="icon-btn whatsapp"
                        title="WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </a>

                      <button
                        className="icon-btn edit"
                        onClick={() => openEditLead(lead)}
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        className="icon-btn delete"
                        title="Eliminar"
                        onClick={() =>
                          setConfirm({
                            show: true,
                            title: "Eliminar lead",
                            message:
                              "¿Seguro que querés eliminar este lead?",
                            onConfirm: () => deleteLead(lead)
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={page === i + 1 ? "active" : ""}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MODAL NUEVO / EDITAR */}
      {editingLead !== null && (
        <NuevoLead
          initialData={editingLead}
          onClose={() => setEditingLead(null)}
          onSaved={() => {
            setEditingLead(null);
            fetchLeads();
          }}
        />
      )}

      {/* MODAL CONFIRM */}
      {confirm?.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{confirm.title}</h3>
            <p>{confirm.message}</p>

            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={confirm.onConfirm}
              >
                Confirmar
              </button>
              <button
                className="btn-secondary"
                onClick={() => setConfirm(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
