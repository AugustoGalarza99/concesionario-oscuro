import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useDealership } from "../../hooks/useDealership";
import { useAuth } from "../../context/AuthContext";
import { Car, DollarSign, TrendingUp, AlertTriangle, CheckCircle, XCircle, Target,} from "lucide-react";
import { loadDashboardCache, saveDashboardCache, clearDashboardCache,} from "../../cache/adminDashboardCache";
import { toast } from "sonner";
import "./AdminDashboard.css";

const months = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

const EXPENSE_CATEGORIES = [
  "Alquiler",
  "Luz",
  "Internet",
  "Sueldos",
  "Comisiones",
  "Otros",
];

const normalizeMetodoPago = (raw) => {
  if (!raw) return [];

  // Si ya es array → perfecto
  if (Array.isArray(raw)) return raw;

  // Si viene como string: "efectivo, dolares"
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }

  // Si viene como objeto: { efectivo: true, dolares: false }
  if (typeof raw === "object") {
    return Object.entries(raw)
      .filter(([_, v]) => v)
      .map(([k]) => k);
  }

  return [];
};


export default function AdminDashboard() {
  const { dealershipId } = useDealership();
  const { isAdmin } = useAuth();

  const [ventas, setVentas] = useState([]);
  const [generalExpenses, setGeneralExpenses] = useState([]);

  const [expenseForm, setExpenseForm] = useState({
    description: "",
    category: "Alquiler",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingExpenseValue, setEditingExpenseValue] = useState("");
  const [selectedVenta, setSelectedVenta] = useState(null);

    const { staleVehicles, stockSemaforo } = useMemo(() => {
      const now = Date.now();
      let green = 0, yellow = 0, red = 0;
      const stale = [];

      vehicles.forEach(v => {
        if (v.sold || !v.entry_ts) return;

        const days = Math.floor((now - v.entry_ts) / 86400000);

        if (days < 45) green++;
        else if (days < 60) yellow++;
        else {
          red++;
          stale.push({ ...v, days });
        }
      });

      stale.sort((a, b) => b.days - a.days);

      return {
        stockSemaforo: { green, yellow, red },
        staleVehicles: stale
      };
    }, [vehicles]);

  /* ================= LOAD DATA (MONTH CACHED) ================= */
  useEffect(() => {
    if (!dealershipId || !isAdmin) return;

    const loadDashboard = async () => {
      console.log(`📊 Dashboard → ${year}-${month + 1}`);
      setLoading(true);

      // 1️⃣ Chequear versión
      const { data: versionRow, error } = await supabase
        .from("dealership_versions")
        .select("admin_dashboard_version")
        .eq("dealership_id", dealershipId)
        .single();

      if (error) {
        console.error("❌ Error versión dashboard", error);
        setLoading(false);
        return;
      }

      const version = versionRow.admin_dashboard_version;

      // 2️⃣ Cache
      const cached = loadDashboardCache(dealershipId, year, month);

      if (cached && cached.version === version) {
        console.log("📦 Dashboard desde cache", `${year}-${month + 1}`);
        setVentas(cached.ventas);
        setGeneralExpenses(cached.generalExpenses);
        setVehicles(cached.vehicles);
        setLoading(false);
        return;
      }

      console.log("🌐 Dashboard desde DB", `${year}-${month + 1}`);

      // 3️⃣ Rango de fechas del mes
      const inicioMes = new Date(year, month, 1);
      const finMes = new Date(year, month + 1, 1);

      // 4️⃣ Queries optimizadas
      const [{ data: ventasData }, { data: expensesData }, { data: vehiclesData }] =
        await Promise.all([
          supabase
  .from("ventas")
  .select(`
    id,
    fecha,
    precio_venta,
    precio_ingreso,
    total_gastos,
    rentabilidad,
    patente,
    vehiculo_nombre,
    vendedor_nombre,
    cliente_nombre,
    cliente_telefono,
    notas,
    metodo_pago,
    financiacion,
    permuta
  `)

            .eq("dealership_id", dealershipId)
            .gte("fecha", inicioMes.toISOString())
            .lt("fecha", finMes.toISOString()),

          supabase
            .from("general_expenses")
            .select("id, description, category, amount, date")
            .eq("dealership_id", dealershipId)
            .gte("date", inicioMes.toISOString())
            .lt("date", finMes.toISOString()),

          supabase
            .from("vehicles")
            .select("id, plate, brand, model, sold, entry_date")
            .eq("dealership_id", dealershipId),
        ]);

      const vehiclesParsed = (vehiclesData || []).map(v => ({
        ...v,
        entry_ts: v.entry_date ? new Date(v.entry_date).getTime() : null,
      }));

      const ventasParsed = (ventasData || []).map(v => ({
        ...v,
        metodo_pago: normalizeMetodoPago(v.metodo_pago),
      }));

      setVentas(ventasParsed);

      setGeneralExpenses(expensesData || []);
      setVehicles(vehiclesParsed);

      // 5️⃣ Guardar cache
      saveDashboardCache(dealershipId, year, month, {
        version,
        ventas: ventasData || [],
        generalExpenses: expensesData || [],
        vehicles: vehiclesParsed,
      });

      console.log("💾 Cache dashboard guardado", `${year}-${month + 1}`);
      setLoading(false);
    };

    loadDashboard();
  }, [dealershipId, isAdmin, year, month]);


  /* ================= REALTIME VENTAS ================= */
  useEffect(() => {
    if (!dealershipId || !isAdmin) return;

    const channel = supabase
      .channel("dashboard-invalidate")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ventas" },
        () => {
          console.log("♻️ Invalida cache dashboard");
          clearDashboardCache(dealershipId);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "general_expenses" },
        () => {
          clearDashboardCache(dealershipId);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [dealershipId, isAdmin]);

  /* ================= MÉTRICAS ================= */
  const metrics = useMemo(() => {
    const ingresos = ventas.reduce(
      (a, b) => a + Number(b.precio_venta || 0), 0
    );

    const costoVehiculos = ventas.reduce(
      (a, b) => a + Number(b.precio_ingreso || 0), 0
    );

    const gastosVehiculos = ventas.reduce(
      (a, b) => a + Number(b.total_gastos || 0), 0
    );

    // 👉 EGRESOS OPERATIVOS (lo que ya venías usando)
    const egresos = costoVehiculos + gastosVehiculos;

    // 👉 RENTABILIDAD BRUTA (correcta como la venías manejando)
    const rentabilidadBruta = ingresos - egresos;

    // 👉 GASTOS FIJOS DEL MES
    const gastosFijos = generalExpenses
      .filter(e =>
        ["Alquiler", "Luz", "Internet", "Sueldos"].includes(e.category)
      )
      .reduce((a, b) => a + Number(b.amount || 0), 0);

    // 👉 RENTABILIDAD NETA REAL
    const rentabilidadNeta = rentabilidadBruta - gastosFijos;

    return {
      operaciones: ventas.length,
      ingresos,
      egresos,
      rentabilidadBruta,
      gastosFijos,
      rentabilidadNeta,
    };
  }, [ventas, generalExpenses]);



    /* ================= STOCK ================= */
    const stockActual = useMemo(
      () => vehicles.filter(v => !v.sold),
      [vehicles]
    );

    const gastosFijosMes = useMemo(() => {
      return generalExpenses
        .filter(e =>
          ["Alquiler","Luz","Internet","Sueldos"].includes(e.category)
        )
        .reduce((a,b) => a + Number(b.amount || 0), 0);
    }, [generalExpenses]);

  /* ================= ADD GENERAL EXPENSE ================= */
    const addGeneralExpense = async () => {
      if (!expenseForm.description || !expenseForm.amount) {
        toast.warning("Completá todos los campos del gasto");
        return;
      }

      const { data, error } = await supabase
        .from("general_expenses")
        .insert({
          dealership_id: dealershipId,
          description: expenseForm.description,
          category: expenseForm.category,
          amount: expenseForm.amount,
          date: expenseForm.date,
        })
        .select()
        .single();

      if (error) {
        toast.error("Error al guardar gasto");
        return;
      }

      toast.success("Gasto agregado correctamente");

      setGeneralExpenses(prev => [...prev, data]);

      setExpenseForm({
        description: "",
        category: "Alquiler",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
      });
    };


  if (!isAdmin) return null;
  if (loading) return <div className="dash-loading">Cargando dashboard…</div>;

  const saveExpenseEdit = async (expense) => {
  if (!editingExpenseValue) {
    toast.warning("El monto no puede estar vacío");
    return;
  }

  const loadingToast = toast.loading("Actualizando gasto...");

  const { error } = await supabase
    .from("general_expenses")
    .update({ amount: editingExpenseValue })
    .eq("id", expense.id);

  if (error) {
    toast.error("Error al actualizar el gasto");
    toast.dismiss(loadingToast);
    return;
  }

  setGeneralExpenses(prev =>
    prev.map(e =>
      e.id === expense.id ? { ...e, amount: editingExpenseValue } : e
    )
  );

  setEditingExpenseId(null);
  setEditingExpenseValue("");
  toast.dismiss(loadingToast);
  toast.success("Gasto actualizado");
};

const deleteExpense = (expense) => {
  toast("¿Eliminar este gasto?", {
    description: expense.description,
    action: {
      label: "Eliminar",
      onClick: async () => {
        const loadingToast = toast.loading("Eliminando gasto...");

        const { error } = await supabase
          .from("general_expenses")
          .delete()
          .eq("id", expense.id);

        if (error) {
          toast.error("Error al eliminar gasto");
          toast.dismiss(loadingToast);
          return;
        }

        setGeneralExpenses(prev => prev.filter(e => e.id !== expense.id));
        toast.dismiss(loadingToast);
        toast.success("Gasto eliminado");
      }
    }
  });
};


  return (
    <div className="admin-dashboard">
      {/* HEADER */}
      <header className="dash-header">
        <div>
          <h1>Dashboard Administrativo</h1>
          <p>Control total del negocio</p>
        </div>

        <div className="dash-filters">
          <select value={year} onChange={e => setYear(+e.target.value)}>
            {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>

          <select value={month} onChange={e => setMonth(+e.target.value)}>
            {months.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
        </div>
      </header>

      <section className="panel">
        <h2>Salud del stock</h2>

        <div className="semaforo">
          <div className="dot green">
            🟢 {stockSemaforo.green} óptimos
          </div>
          <div className="dot yellow">
            🟡 {stockSemaforo.yellow} atención
          </div>
          <div className="dot red">
            🔴 {stockSemaforo.red} críticos
          </div>
        </div>
      </section>

      {staleVehicles.length > 0 && (
        <section className="alert-stock">
          <AlertTriangle />

          <div>
            <h3>Stock sin rotación</h3>
            <p>
              Hay <strong>{staleVehicles.length}</strong> vehículos con más de 60 días
              sin vender. Atención para evitar capital inmovilizado.
            </p>

            {staleVehicles.slice(0, 3).map(v => (
              <div key={v.id} className="alert-row">
                <span>
                  {v.plate} – {v.brand} {v.model}
                </span>
                <strong>{v.days} días</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* KPIs */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <Car />
          <h3>{stockActual.length}</h3>
          <span>Stock actual</span>
        </div>
      
        <div className="kpi-card">
          <Car />
          <h3>{metrics.operaciones}</h3>
          <span>Ventas del mes</span>
        </div>

        <div className="kpi-card blue">
          <DollarSign />
          <h3>${metrics.ingresos.toLocaleString()}</h3>
          <span>Ingresos</span>
        </div>

        <div className="kpi-card red">
          <AlertTriangle />
          <h3>${metrics.egresos.toLocaleString()}</h3>
          <span>Egresos</span>
        </div>

        <div className={`kpi-card ${metrics.rentabilidadBruta >= 0 ? "green" : "red"}`}>
          <TrendingUp />
          <h3>${metrics.rentabilidadBruta.toLocaleString()}</h3>
          <span>Rentabilidad bruta</span>
        </div>

        <div className="kpi-card orange">
          <AlertTriangle />
          <h3>${gastosFijosMes.toLocaleString()}</h3>
          <span>Gastos fijos</span>
        </div>    

        <div className={`kpi-card ${metrics.rentabilidadNeta >= 0 ? "green" : "red"}`}>
          <DollarSign />
          <h3>${metrics.rentabilidadNeta.toLocaleString()}</h3>
          <span>Rentabilidad neta</span>
        </div>

      </section>

      {/* GASTOS GENERALES */}
      <section className="panel">
        <h2>Gastos generales</h2>

        <div className="expense-form">
          <input
            placeholder="Descripción"
            value={expenseForm.description}
            onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
          />

          <select
            value={expenseForm.category}
            onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
          >
            {EXPENSE_CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Monto"
            value={expenseForm.amount}
            onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
          />

          <input
            type="date"
            value={expenseForm.date}
            onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
          />

          <button onClick={addGeneralExpense}>Agregar</button>
        </div>

        {generalExpenses.map(e => (
          <div key={e.id} className="expense-row">
            <span>
              {e.description} ({e.category}) • {new Date(e.date).toLocaleDateString()}
            </span>

            <div className="expense-actions">
              {editingExpenseId === e.id ? (
                <>
                  <input
                    type="number"
                    className="dh-icon-btn"
                    value={editingExpenseValue}
                    onChange={ev => setEditingExpenseValue(ev.target.value)}
                    style={{ width: 100 }}
                  />
                  <button className="dh-icon-btn" onClick={() => saveExpenseEdit(e)}>💾</button>
                  <button className="dh-icon-btn" onClick={() => setEditingExpenseId(null)}>✖</button>
                </>
              ) : (
                <>
                  <strong>${Number(e.amount).toLocaleString()}</strong>
                  <button
                  className="dh-icon-btn"
                    onClick={() => {
                      setEditingExpenseId(e.id);
                      setEditingExpenseValue(e.amount);
                    }}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                  className="dh-icon-btn"
                    onClick={() => deleteExpense(e)}
                    title="Eliminar"
                  >
                    🗑
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* RENTABILIDAD POR VEHÍCULO */}
      <section className="panel">
        <h2>Rentabilidad por vehículo</h2>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Patente</th>
                <th>Vehículo</th>
                <th>Ingreso</th>
                <th>Costo</th>
                <th>Gastos</th>
                <th>Resultado</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map(v => (
                <tr key={v.id}>
                  <td>{new Date(v.fecha).toLocaleDateString()}</td>
                  <td className="plate">{v.patente}</td>
                  <td>{v.vehiculo_nombre}</td>
                  <td>${Number(v.precio_venta).toLocaleString()}</td>
                  <td>${Number(v.precio_ingreso).toLocaleString()}</td>
                  <td>${Number(v.total_gastos).toLocaleString()}</td>
                  <td className={v.rentabilidad >= 0 ? "pos" : "neg"}>
                    ${Number(v.rentabilidad).toLocaleString()}
                  </td>
                  <td>
                    {v.rentabilidad >= 0 ? (
                      <span className="badge success">
                        <CheckCircle size={14} /> Ganancia
                      </span>
                    ) : (
                      <span className="badge danger">
                        <XCircle size={14} /> Pérdida
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                    className="dh-icon-btn"
                      title="Ver detalle"
                      onClick={() => setSelectedVenta(v)}
                    >
                      👁
                    </button>
                  </td>
                </tr>
              ))}
              {ventas.length === 0 && (
                <tr>
                  <td colSpan="9" className="empty">
                    No hay ventas este mes
                  </td>
                </tr>
              )}            
            </tbody>
          </table>
        </div>
      </section>
      {selectedVenta && (
        <div className="modal-backdrop" onClick={() => setSelectedVenta(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Detalle de la venta</h3>

            <p><strong>Vehículo:</strong> {selectedVenta.vehiculo_nombre}</p>
            <p><strong>Patente:</strong> {selectedVenta.patente}</p>
            <p><strong>Vendedor:</strong> {selectedVenta.vendedor_nombre}</p>
            <p><strong>Cliente:</strong> {selectedVenta.cliente_nombre}</p>
            <p><strong>Teléfono:</strong> {selectedVenta.cliente_telefono}</p>
            <p><strong>Fecha:</strong> {new Date(selectedVenta.fecha).toLocaleDateString()}</p>
            <p><strong>Método de pago:</strong>{" "}{Array.isArray(selectedVenta.metodo_pago) && selectedVenta.metodo_pago.length > 0
              ? selectedVenta.metodo_pago.join(", ")
              : "—"}
            </p>
            <p><strong>Financiación:</strong> {selectedVenta.financiacion ? "Sí" : "No"}</p>
            <p><strong>Permuta:</strong> {selectedVenta.permuta ? "Sí" : "No"}</p>
            <p><strong>Notas:</strong> {typeof selectedVenta.notas === "string" ? selectedVenta.notas : "—"}</p>

            <button onClick={() => setSelectedVenta(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
