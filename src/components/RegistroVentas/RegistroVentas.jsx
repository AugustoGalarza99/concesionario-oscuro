import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useDealership } from "../../hooks/useDealership";
import { Car, DollarSign, Plus, Search, Calendar, User, Phone, FileText, Trash2, Loader2, X, Edit, Filter, CheckCircle} from "lucide-react";
import { toast } from "sonner";
import "./RegistroVentas.css";

// cache/ventasCache.js (o arriba del componente)

const getVentasMesKey = (dealershipId, date = new Date()) => {
  const ym = `${date.getFullYear()}-${date.getMonth() + 1}`;
  return `ventas_mes:${dealershipId}:${ym}`;
};

const loadVentasCache = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveVentasCache = (key, data) => {
  sessionStorage.setItem(key, JSON.stringify(data));
};

const clearVentasMesCache = (dealershipId, date = new Date()) => {
  sessionStorage.removeItem(getVentasMesKey(dealershipId, date));
};


export default function RegistroVentas() {
  const { dealershipId, loading: dealershipLoading } = useDealership();
  const { user, profile, isAdmin } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [vendedores, setVendedores] = useState([]); // Usuarios con rol vendedor/admin
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("todas");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [ventaAEliminar, setVentaAEliminar] = useState(null);

  // Form nueva venta
  const [showForm, setShowForm] = useState(false);
  const [nuevaVenta, setNuevaVenta] = useState({
    vehiculoId: "",
    vendedorId: "",
    precioVenta: "",
    clienteNombre: "",
    clienteTelefono: "",
    notas: "",
    metodoPago: {
      efectivo: false,
      transferencia: false,
      dolares: false,
      cheques: false,
    },
    financiacion: false,
    permuta: false,
  });
  const [formError, setFormError] = useState("");

  // Form editar venta
  const [editandoVenta, setEditandoVenta] = useState(null);

const mapVenta = (v) => ({
  id: v.id,
  fecha: v.fecha,
  precioVenta: v.precio_venta,
  clienteNombre: v.cliente_nombre,
  clienteTelefono: v.cliente_telefono,
  vehiculoNombre: v.vehiculo_nombre,
  vendedorNombre: v.vendedor_nombre,
  notas: v.notas,
  metodoPago: v.metodo_pago,
  financiacion: v.financiacion,
  permuta: v.permuta,
  rentabilidad: v.rentabilidad,
});



  // Cargar vehículos (local-first)
  const cargarVehiculos = async () => {
    if (!dealershipId) return;

    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          id,
          plate,
          brand,
          model,
          purchase_price,
          sold
        `)
        .eq("dealership_id", dealershipId)
        .eq("sold", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setVehiculos(data || []);
    } catch (err) {
      console.error("Error cargando vehículos:", err);
      toast.error("Error cargando vehículos disponibles");
    }
  };


  // Cargar vendedores (usuarios con rol vendedor o admin)
  const cargarVendedores = async () => {
    if (!dealershipId) return;

    console.log("👤 Cargando vendedores desde DB");

    try {
      const { data, error } = await supabase
        .from("vw_dealership_staff")
        .select("user_id, role, name")
        .eq("dealership_id", dealershipId)
        .in("role", ["admin", "vendedor"]);

      if (error) throw error;

      const mapped = (data || []).map(u => ({
        id: u.user_id,
        role: u.role,
        name: u.name,
      }));

      setVendedores(mapped);
      console.log("✅ Vendedores cargados:", mapped.length);
    } catch (err) {
      console.error("❌ Error cargando vendedores:", err);
    }
  };


  // Cargar ventas (local-first)
  const cargarVentasMesActual = async () => {
    if (!dealershipId) return;

    const cacheKey = getVentasMesKey(dealershipId);
    const cached = loadVentasCache(cacheKey);

    if (cached) {
      console.log("📦 Ventas mes desde cache");
      setVentas(cached);
      return; // 🔥 CLAVE: cortar acá
    }

    console.log("🌐 Ventas mes desde DB");

    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const { data, error } = await supabase
      .from("ventas")
      .select(`
        id,
        fecha,
        precio_venta,
        cliente_nombre,
        cliente_telefono,
        vehiculo_nombre,
        vendedor_nombre,
        notas
      `)
      .eq("dealership_id", dealershipId)
      .gte("fecha", inicioMes.toISOString())
      .lt("fecha", finMes.toISOString())
      .order("fecha", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error cargando ventas:", error);
      toast.error("Error cargando ventas");
      return;
    }

    const mapped = (data || []).map(mapVenta);

    setVentas(mapped);
    saveVentasCache(cacheKey, mapped);
  };

  // 🔎 Cargar ventas por rango personalizado (sin cache)
  const cargarVentasPorRango = async (desde, hasta) => {
    if (!dealershipId) return;

    console.log("🌐 [Ventas] Cargando por rango:", desde, "→", hasta);

    const { data, error } = await supabase
      .from("ventas")
      .select(`
        id,
        fecha,
        precio_venta,
        cliente_nombre,
        cliente_telefono,
        vehiculo_nombre,
        vendedor_nombre,
        notas
      `)
      .eq("dealership_id", dealershipId)
      .gte("fecha", new Date(desde).toISOString())
      .lte("fecha", new Date(hasta).toISOString())
      .order("fecha", { ascending: false });

    if (error) {
      console.error("❌ [Ventas] Error rango:", error);
      toast.error("Error cargando ventas por rango");
      return;
    }

    const mapped = (data || []).map(mapVenta);

    console.log("✅ [Ventas] Rango cargado:", mapped.length, "ventas");

    setVentas(mapped);
  };


  useEffect(() => {
    if (dealershipLoading || !dealershipId) return;

    const init = async () => {
      console.log("🚀 Init RegistroVentas");
      setLoading(true);

      await Promise.all([
        cargarVehiculos(),
        cargarVendedores(),
      ]);

      setLoading(false);
    };

    init();
  }, [dealershipId, dealershipLoading]);

  // Filtrar por fecha
  const ventasFiltradasPorFecha = ventas.filter((venta) => {
    const fechaVenta = venta.fecha?.toDate ? venta.fecha.toDate() : new Date(venta.fecha);
    const hoy = new Date();

    if (filtroFecha === "todas") return true;
    if (filtroFecha === "semana") {
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay());
      return fechaVenta >= inicioSemana;
    }
    if (filtroFecha === "mes") {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return fechaVenta >= inicioMes;
    }
    if (filtroFecha === "rango" && fechaInicio && fechaFin) {
      return fechaVenta >= new Date(fechaInicio) && fechaVenta <= new Date(fechaFin);
    }
    return true;
  });

  // Filtro por texto
  const ventasFiltradas = ventasFiltradasPorFecha.filter((v) =>
    (v.clienteNombre?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (v.vehiculoNombre?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (v.vendedorNombre?.toLowerCase() || "").includes(search.toLowerCase()) ||
    v.id.includes(search)
  );

  // Estadísticas
  const totalVendido = ventasFiltradas.reduce((sum, v) => sum + (v.precioVenta || 0), 0);
  const promedioVenta = ventasFiltradas.length > 0 ? (totalVendido / ventasFiltradas.length).toFixed(0) : 0;
  const cantidadVentas = ventasFiltradas.length;

  // Registrar nueva venta
  const handleRegistrarVenta = async (e) => {
    e.preventDefault();

    if (!nuevaVenta.vehiculoId || !nuevaVenta.precioVenta) {
      toast.warning("Seleccioná un vehículo y el precio de venta");
      return;
    }

    try {
      const vehiculo = vehiculos.find(v => v.id === nuevaVenta.vehiculoId);
      if (!vehiculo) {
        toast.error("Vehículo no encontrado");
        return;
      }

      // 🔹 Traer gastos del vehículo
      const { data: gastos, error: gastosError } = await supabase
        .from("vehicle_expenses")
        .select("amount")
        .eq("vehicle_id", vehiculo.id);

      if (gastosError) throw gastosError;

      const totalGastos = gastos?.reduce(
        (sum, g) => sum + Number(g.amount || 0),
        0
      );

      const precioVenta = Number(nuevaVenta.precioVenta);
      const precioIngreso = Number(vehiculo.purchase_price);
      const metodosSeleccionados = Object.entries(nuevaVenta.metodoPago)
      .filter(([_, v]) => v)
      .map(([k]) => k);

      const ventaPayload = {
        dealership_id: dealershipId,
        vehiculo_id: vehiculo.id,
        vehiculo_nombre: `${vehiculo.brand} ${vehiculo.model}`,
        patente: vehiculo.plate,
        precio_ingreso: precioIngreso,
        total_gastos: totalGastos,
        precio_venta: precioVenta,
        rentabilidad: precioVenta - precioIngreso - totalGastos,
        cliente_nombre: nuevaVenta.clienteNombre,
        cliente_telefono: nuevaVenta.clienteTelefono,
        notas: nuevaVenta.notas,
        vendedor_id: user.id,
        vendedor_nombre: profile?.name || user.email,
        fecha: new Date(),
        metodo_pago: metodosSeleccionados,
        financiacion: nuevaVenta.financiacion,
        permuta: nuevaVenta.permuta,
      };

      // 🔹 Insert venta
      const { data: ventaCreada, error } = await supabase
        .from("ventas")
        .insert(ventaPayload)
        .select()
        .single();

      if (error) throw error;

      // 🔹 Marcar vehículo como vendido
      await supabase
        .from("vehicles")
        .update({ sold: true })
        .eq("id", vehiculo.id);

      setVentas(prev => [mapVenta(ventaCreada), ...prev]);
      setVehiculos(prev => prev.filter(v => v.id !== vehiculo.id));

      setNuevaVenta({
        vehiculoId: "",
        precioVenta: "",
        clienteNombre: "",
        clienteTelefono: "",
        notas: "",
      });

      setShowForm(false);
      toast.success("Venta registrada y vehículo marcado como vendido");
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar la venta");
    }
    clearVentasMesCache(dealershipId);
    await cargarVentasMesActual();
  };

  useEffect(() => {
    if (!dealershipId) return;

    if (filtroFecha === "rango" && fechaInicio && fechaFin) {
      console.log("🗓️ [Ventas] Modo rango personalizado");
      cargarVentasPorRango(fechaInicio, fechaFin);
    } else {
      console.log("📊 [Ventas] Modo mes actual (cache)");
      cargarVentasMesActual();
    }
  }, [dealershipId, filtroFecha, fechaInicio, fechaFin]);


  // Editar venta (similar a registrar, pero con updateDoc)
  const handleEditarVenta = async (e) => {
    e.preventDefault();

    if (!editandoVenta.precioVenta) {
      toast.warning("El precio de venta es obligatorio");
      return;
    }

    try {
      const vendedor = vendedores.find(u => u.id === editandoVenta.vendedorId);

      const updatedData = {
        precio_venta: Number(editandoVenta.precioVenta),
        cliente_nombre: editandoVenta.clienteNombre.trim(),
        cliente_telefono: editandoVenta.clienteTelefono.trim(),
        notas: editandoVenta.notas.trim(),
        vendedor_id: editandoVenta.vendedorId,
        vendedor_nombre: vendedor
          ? vendedor.displayName || vendedor.email
          : editandoVenta.vendedorNombre,
        updated_at: new Date(),
      };

      await supabase
        .from("ventas")
        .update(updatedData)
        .eq("id", editandoVenta.id)
        .eq("dealership_id", dealershipId);

      setVentas(prev =>
        prev.map(v => v.id === editandoVenta.id ? { ...v, ...updatedData } : v)
      );

      setEditandoVenta(null);
      setFormError("");
      toast.success("Venta actualizada correctamente");
    } catch (err) {
      console.error("Error editando venta:", err);
      toast.error("Error al actualizar la venta");
    }
  };

  // Eliminar venta
  const handleEliminarVenta = (ventaId) => {
    setVentaAEliminar(ventaId);
    setShowConfirmDelete(true);
  };

  const confirmarEliminacion = async () => {
    if (!ventaAEliminar) return;

    try {
      await supabase
        .from("ventas")
        .delete()
        .eq("id", ventaAEliminar)
        .eq("dealership_id", dealershipId);

      if (!isAdmin) {
        toast.error("Solo el administrador puede eliminar ventas");
        return;
      }

      setVentas(prev => prev.filter(v => v.id !== ventaAEliminar));
      clearVentasMesCache(dealershipId);

      toast.success("Venta eliminada correctamente");
    } catch (err) {
      console.error("Error eliminando venta:", err);
      toast.error("Error al eliminar la venta");
    }

    setShowConfirmDelete(false);
    setVentaAEliminar(null);
  };

  return (
    <div className="ventas-page">
      {/* Header */}
      <div className="ventas-header">
        <div className="header-title">
          <div>
            <h1>Registro de Ventas</h1>
            <p className="header-subtitle">Control y seguimiento de todas tus operaciones</p>
          </div>
        </div>

        <div className="ventas-controls">
          <div className="search-container2">
            <Search size={20} />
            <input
              placeholder="Buscar cliente, vehículo o vendedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filtro-fecha">
            <Filter size={20} />
            <select value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)}>
              <option value="todas">Ventas del mes</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
              <option value="rango">Rango personalizado</option>
            </select>
          </div>

          {filtroFecha === "rango" && (
            <div className="rango-fechas">
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          )}

          <button className="btn-nueva-venta" onClick={() => setShowForm(true)}>
            <Plus size={20} /> Nueva Venta
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="ventas-stats">
        <div className="stat-card">
          <span className="stat-value">${Number(totalVendido).toLocaleString("es-AR")}</span>
          <span className="stat-label">Total Vendido</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{cantidadVentas}</span>
          <span className="stat-label">Ventas Filtradas</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">${Number(promedioVenta).toLocaleString("es-AR")}</span>
          <span className="stat-label">Promedio</span>
        </div>
      </div>

      {/* Lista de ventas */}
      {loading ? (
        <div className="loading-container">
          <Loader2 size={40} className="spin" />
          <p>Cargando registro de ventas...</p>
        </div>
      ) : ventasFiltradas.length === 0 ? (
        <div className="empty-state">
          <DollarSign size={64} />
          <h3>No hay ventas registradas aún</h3>
          <p>¡Comenzá registrando tu primera venta!</p>
        </div>
      ) : (
        <>
          <div className="ventas-table">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Vehículo</th>
                  <th>Vendedor</th>
                  <th>Cliente</th>
                  <th>Precio Venta</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventasFiltradas.map((venta) => (
                  <tr key={venta.id}>
                    <td>
                      {venta.fecha?.toDate
                        ? venta.fecha.toDate().toLocaleDateString("es-AR", { dateStyle: "medium" })
                        : new Date(venta.fecha).toLocaleDateString("es-AR")}
                    </td>
                    <td>{venta.vehiculoNombre}</td>
                    <td>{venta.vendedorNombre || "-"}</td>
                    <td>
                      {venta.clienteNombre || "-"}
                      {venta.clienteTelefono && <br />}
                      {venta.clienteTelefono || ""}
                    </td>
                    <td className="precio-venta">
                      ${(venta.precioVenta ?? 0).toLocaleString("es-AR")}
                    </td>
                    <td className="notas-col">{venta.notas || "-"}</td>
                    <td className="acciones-col">
                      <button className="btn-edit" onClick={() => setEditandoVenta(venta)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-delete" onClick={() => handleEliminarVenta(venta.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ventas-cards">
            {ventasFiltradas.map((venta) => (
              <div key={venta.id} className="venta-card">
                <div className="venta-head">
                  <span className="venta-fecha">
                    {venta.fecha?.toDate
                      ? venta.fecha.toDate().toLocaleDateString("es-AR")
                      : new Date(venta.fecha).toLocaleDateString("es-AR")}
                  </span>
                  <span className="venta-precio">
                    ${(venta.precioVenta ?? 0).toLocaleString("es-AR")}
                  </span>

                </div>
                <h3 className="venta-vehiculo">{venta.vehiculoNombre}</h3>
                <p className="venta-vendedor">
                  <User size={16} /> Vendedor: {venta.vendedorNombre || "Sin asignar"}
                </p>
                {venta.clienteNombre && (
                  <p className="venta-cliente">
                    <User size={16} /> Cliente: {venta.clienteNombre}
                    {venta.clienteTelefono && ` - ${venta.clienteTelefono}`}
                  </p>
                )}
                {venta.notas && (
                  <p className="venta-notas">
                    <FileText size={16} /> {venta.notas}
                  </p>
                )}
                <div className="venta-actions">
                  <button onClick={() => setEditandoVenta(venta)}>
                    <Edit size={16} /> Editar
                  </button>
                  <button className="delete" onClick={() => handleEliminarVenta(venta.id)}>
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Nueva Venta */}
      {showForm && (
        <div className="venta-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="venta-modal" onClick={(e) => e.stopPropagation()}>
            <div className="venta-modal-header">
              <h2>Nueva Venta</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleRegistrarVenta}>
              <div className="form-group">
                <label>Vehículo vendido *</label>
                <select
  value={nuevaVenta.vehiculoId}
  onChange={(e) =>
    setNuevaVenta({ ...nuevaVenta, vehiculoId: e.target.value })
  }
>
  <option value="">Seleccionar vehículo</option>
  {vehiculos.map((v) => (
    <option key={v.id} value={v.id}>
      {v.plate} – {v.brand} {v.model}
    </option>
  ))}
</select>

              </div>

              <div className="form-group">
                <label>Vendedor *</label>
                <select
                  value={nuevaVenta.vendedorId}
                  onChange={(e) => setNuevaVenta({ ...nuevaVenta, vendedorId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar vendedor</option>
                  {vendedores.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Precio de venta *</label>
                <div className="precio-input">
                  <input
                    type="number"
                    min="0"
                    value={nuevaVenta.precioVenta}
                    onChange={(e) => setNuevaVenta({ ...nuevaVenta, precioVenta: e.target.value })}
                    placeholder="Ej: 25000000"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Nombre del cliente (opcional)</label>
                <input
                  type="text"
                  value={nuevaVenta.clienteNombre}
                  onChange={(e) => setNuevaVenta({ ...nuevaVenta, clienteNombre: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div className="form-group">
                <label>Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={nuevaVenta.clienteTelefono}
                  onChange={(e) => setNuevaVenta({ ...nuevaVenta, clienteTelefono: e.target.value })}
                  placeholder="Ej: +5491123456789"
                />
              </div>

              <div className="form-group">
                <label>Método de pago</label>

                {["efectivo", "transferencia", "dolares", "cheques"].map(m => (
                  <label key={m} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={nuevaVenta.metodoPago[m]}
                      onChange={(e) =>
                        setNuevaVenta({
                          ...nuevaVenta,
                          metodoPago: {
                            ...nuevaVenta.metodoPago,
                            [m]: e.target.checked,
                          },
                        })
                      }
                    />
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </label>
                ))}
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={nuevaVenta.financiacion}
                    onChange={(e) =>
                      setNuevaVenta({ ...nuevaVenta, financiacion: e.target.checked })
                    }
                  />
                  Financiación
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={nuevaVenta.permuta}
                    onChange={(e) =>
                      setNuevaVenta({ ...nuevaVenta, permuta: e.target.checked })
                    }
                  />
                  Permuta
                </label>
              </div>

              <div className="form-group">
                <label>Notas / Comentarios</label>
                <textarea
                  rows="3"
                  value={nuevaVenta.notas}
                  onChange={(e) => setNuevaVenta({ ...nuevaVenta, notas: e.target.value })}
                  placeholder="Ej: Vendido con financiación, entrega en 15 días..."
                />
              </div>

              {formError && <div className="form-error">{formError}</div>}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit">
                  Registrar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
        {showConfirmDelete && (
        <div className="venta-modal-overlay" onClick={() => setShowConfirmDelete(false)}>
            <div className="venta-modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="venta-modal-header">
                <h2>¿Confirmar eliminación?</h2>
                <button onClick={() => setShowConfirmDelete(false)}>
                <X size={24} />
                </button>
            </div>

            <div className="confirm-content">
                <p>Estás a punto de eliminar esta venta.</p>
                <p className="warning-text">Esta acción no se puede deshacer.</p>
            </div>

            <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowConfirmDelete(false)}>
                Cancelar
                </button>
                <button type="button" className="btn-delete-confirm" onClick={confirmarEliminacion}>
                Eliminar Venta
                </button>
            </div>
            </div>
        </div>
        )}

      {/* Modal Editar Venta */}
      {editandoVenta && (
        <div className="venta-modal-overlay" onClick={() => setEditandoVenta(null)}>
          <div className="venta-modal" onClick={(e) => e.stopPropagation()}>
            <div className="venta-modal-header">
              <h2>Editar Venta</h2>
              <button onClick={() => setEditandoVenta(null)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditarVenta}>
              <div className="form-group">
                <label>Vehículo</label>
                <input type="text" value={editandoVenta.vehiculoNombre} disabled />
              </div>

              <div className="form-group">
                <label>Vendedor</label>
                <select
                  value={editandoVenta.vendedorId || ""}
                  onChange={(e) => setEditandoVenta({ ...editandoVenta, vendedorId: e.target.value })}
                >
                  <option value="">Sin cambiar</option>
                  {vendedores.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Precio de venta *</label>
                <div className="precio-input">
                  <input
                    type="number"
                    min="0"
                    value={editandoVenta.precioVenta}
                    onChange={(e) => setEditandoVenta({ ...editandoVenta, precioVenta: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Nombre del cliente</label>
                <input
                  type="text"
                  value={editandoVenta.clienteNombre}
                  onChange={(e) => setEditandoVenta({ ...editandoVenta, clienteNombre: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={editandoVenta.clienteTelefono}
                  onChange={(e) => setEditandoVenta({ ...editandoVenta, clienteTelefono: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Método de pago</label>

                {["efectivo", "transferencia", "dolares", "cheques"].map(m => (
                  <label key={m} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={nuevaVenta.metodoPago[m]}
                      onChange={(e) =>
                        setNuevaVenta({
                          ...nuevaVenta,
                          metodoPago: {
                            ...nuevaVenta.metodoPago,
                            [m]: e.target.checked,
                          },
                        })
                      }
                    />
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </label>
                ))}
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={nuevaVenta.financiacion}
                    onChange={(e) =>
                      setNuevaVenta({ ...nuevaVenta, financiacion: e.target.checked })
                    }
                  />
                  Financiación
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={nuevaVenta.permuta}
                    onChange={(e) =>
                      setNuevaVenta({ ...nuevaVenta, permuta: e.target.checked })
                    }
                  />
                  Permuta
                </label>
              </div>

              <div className="form-group">
                <label>Notas</label>
                <textarea
                  rows="3"
                  value={editandoVenta.notas}
                  onChange={(e) => setEditandoVenta({ ...editandoVenta, notas: e.target.value })}
                />
              </div>

              {formError && <div className="form-error">{formError}</div>}

              <div className="modal-actions">
                <button type="button" onClick={() => setEditandoVenta(null)}>
                  Cancelar
                </button>
                <button type="submit">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}