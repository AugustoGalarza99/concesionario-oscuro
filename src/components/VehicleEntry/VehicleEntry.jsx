import { useEffect, useState, useMemo, useRef } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { useDealership } from "../../hooks/useDealership";
import { loadVehiclesCache, saveVehiclesCache, clearVehiclesCache,} from "../../cache/vehiclesStockCache";
import "./VehicleEntry.css";

const EMPTY_FORM = {
  brand: "",
  model: "",
  year: "",
  plate: "",
  kilometers: "",
  purchase_price: "",
  entry_date: "",
  previous_owner: "",
  previous_owner_phone: "",
};

const REQUIRED_FIELDS = [
  "brand",
  "model",
  "year",
  "plate",
  "kilometers",
  "purchase_price",
  "entry_date",
];

function VehicleEntry() {
  const { user, profile, isAdmin } = useAuth();
  const { dealershipId } = useDealership();

  const [vehicles, setVehicles] = useState([]);
  const [sales, setSales] = useState([]);

  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [expense, setExpense] = useState({ description: "", amount: "" });
  const [expenses, setExpenses] = useState([]);
  const [expensesVehicleId, setExpensesVehicleId] = useState(null);

  const [search, setSearch] = useState("");
  const activeVehicle = vehicles.find(v => v.id === expensesVehicleId);

  const formRef = useRef(null);
  const expensesRef = useRef(null);

  /* =========================
     LOAD VEHICLES + SALES
  ========================= */
  const loadVehiclesStock = async () => {
    if (!dealershipId) return;

    console.log("🚗 Stock → chequeando versión");

    // 1️⃣ Leer versión SOLO de stock
    const { data: versionRow, error } = await supabase
      .from("dealership_versions")
      .select("vehicles_stock_version")
      .eq("dealership_id", dealershipId)
      .single();

    if (error) {
      console.error("❌ Error versión stock", error);
      return;
    }

    const currentVersion = versionRow.vehicles_stock_version;

    // 2️⃣ Cache
    const cached = loadVehiclesCache(dealershipId);

    if (cached && cached.version === currentVersion) {
      console.log("📦 Vehículos desde cache");
      setVehicles(cached.vehicles);
      setSales(cached.sales);
      return;
    }

    console.log("🌐 Vehículos desde DB");

    // 3️⃣ DB real (solo columnas necesarias)
    const [{ data: vehicles }, { data: sales }] = await Promise.all([
      supabase
        .from("vehicles")
        .select(`
          id,
          brand,
          model,
          year,
          plate,
          linked,
          sold,
          purchase_price,
          entry_date,
          previous_owner,
          previous_owner_phone,
          kilometers
        `)
        .eq("dealership_id", dealershipId)
        .order("created_at", { ascending: false }),

      supabase
        .from("ventas")
        .select("vehiculo_id")
        .eq("dealership_id", dealershipId),
    ]);

    setVehicles(vehicles || []);
    setSales(sales || []);

    // 4️⃣ Guardar cache
    saveVehiclesCache(dealershipId, {
      version: currentVersion,
      vehicles: vehicles || [],
      sales: sales || [],
    });

    console.log("✅ Cache stock actualizado v", currentVersion);
  };


  useEffect(() => {
    if (dealershipId) loadVehiclesStock();
  }, [dealershipId]);

  /* =========================
     SOLD LOGIC
  ========================= */
  const soldVehicleIds = useMemo(
    () => sales.map(s => s.vehiculo_id),
    [sales]
  );

  const vehiclesWithStatus = vehicles.map(v => ({
    ...v,
    isSold: soldVehicleIds.includes(v.id),
  }));

  const soldCount = vehiclesWithStatus.filter(v => v.isSold).length;

  /* =========================
     ALERT SOLD VEHICLES
  ========================= */
  useEffect(() => {
    if (soldCount > 0 && isAdmin) {
      toast.warning(
        `⚠️ Hay ${soldCount} vehículo(s) vendidos`,
        {
          description:
            "Debés eliminar las patentes vendidas para mantener el sistema limpio y rápido. Los datos ya están guardados en el dashboard.",
          duration: 10000,
        }
      );
    }
  }, [soldCount, isAdmin]);

  /* =========================
     LOAD EXPENSES
  ========================= */
  const loadExpenses = async (vehicleId) => {
    const { data } = await supabase
      .from("vehicle_expenses")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("created_at");

    setExpenses(data || []);
  };

  /* =========================
     SAVE VEHICLE
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasEmptyRequired = REQUIRED_FIELDS.some(
      (field) => !form[field]
    );

    if (hasEmptyRequired) {
      toast.warning("Completá todos los campos obligatorios");
      return;
    }

    const payload = {
      brand: form.brand,
      model: form.model,
      year: form.year,
      plate: form.plate,
      kilometers: form.kilometers,
      purchase_price: form.purchase_price,
      entry_date: form.entry_date,
      previous_owner: form.previous_owner,
      previous_owner_phone: form.previous_owner_phone,
      dealership_id: dealershipId,
      seller_id: user.id,
      seller_name: profile?.name || user.email,
    };

    const { error } = editingVehicle
      ? await supabase
          .from("vehicles")
          .update(payload)
          .eq("id", editingVehicle.id)
      : await supabase.from("vehicles").insert(payload);

    if (error) {
      toast.error("Error guardando vehículo");
      return;
    }

    toast.success(
      editingVehicle ? "Vehículo actualizado" : "Vehículo creado"
    );

    setForm(EMPTY_FORM);
    setEditingVehicle(null);
    clearVehiclesCache(dealershipId);
    loadVehiclesStock();
  };

  /* =========================
     DELETE VEHICLE (ONLY SOLD)
  ========================= */
  const deleteVehicle = (vehicle) => {

    if (!isAdmin) {
      toast.error("Solo el administrador puede eliminar ventas");
      return;
    }

    toast("⚠️ Vehículo vendido", {
      description:
        "Este vehículo ya fue vendido. Eliminarlo mantiene el sistema limpio y evita lentitud.",
      action: {
        label: "Eliminar",
        onClick: async () => {
          await supabase.from("vehicles").delete().eq("id", vehicle.id);
          toast.success("Vehículo eliminado");
          clearVehiclesCache(dealershipId);
          loadVehiclesStock();
        },
      },
      cancel: { label: "Cancelar" },
      duration: 9000,
    });
  };

  /* =========================
     ADD EXPENSE
  ========================= */
  const addExpense = async () => {
    if (!expense.description || !expense.amount) {
      toast.warning("Completá descripción y monto");
      return;
    }

    await supabase.from("vehicle_expenses").insert({
      vehicle_id: expensesVehicleId,
      dealership_id: dealershipId,
      description: expense.description,
      amount: expense.amount,
    });

    toast.success("Gasto agregado");
    setExpense({ description: "", amount: "" });
    loadExpenses(expensesVehicleId);
  };

  const deleteExpense = async (expenseId) => {
  const { error } = await supabase
    .from("vehicle_expenses")
    .delete()
    .eq("id", expenseId);

  if (error) {
    toast.error("Error eliminando gasto");
    return;
  }

  toast.success("Gasto eliminado");
  loadExpenses(expensesVehicleId); // refresca lista
};


  const filteredVehicles = vehiclesWithStatus.filter((v) =>
    `${v.brand} ${v.model} ${v.plate}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="vehicle-entry">
      <h2>Gestión de Vehículos</h2>

      {/* ALERTA VISUAL */}
      {soldCount > 0 && isAdmin && (
        <div className="sold-alert">
          <AlertTriangle />
          <span>
            Hay vehículos vendidos. Eliminarlos mantiene el sistema limpio y rápido.
          </span>
        </div>
      )}

      {/* FORM */}
      <form ref={formRef} className="vehicle-form" onSubmit={handleSubmit}>
        <input placeholder="Marca" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
        <input placeholder="Modelo" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
        <input placeholder="Año" type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
        <input placeholder="Patente" value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} />

        <input placeholder="Kilómetros reales" type="number" value={form.kilometers} onChange={e => setForm({ ...form, kilometers: e.target.value })} />
        <input placeholder="Precio de ingreso" type="number" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} />
        <input type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} />

        <input placeholder="Dueño anterior" value={form.previous_owner} onChange={e => setForm({ ...form, previous_owner: e.target.value })} />
        <input placeholder="Teléfono dueño" value={form.previous_owner_phone} onChange={e => setForm({ ...form, previous_owner_phone: e.target.value })} />

        <div className="form-actions">
  <button type="submit" className="primary">
    {editingVehicle ? "Actualizar vehículo" : "Crear vehículo"}
  </button>

  {editingVehicle && (
    <button
      type="button"
      className="secondary"
      onClick={() => {
        setEditingVehicle(null);
        setForm(EMPTY_FORM);
        toast.info("Edición cancelada");
      }}
    >
      Cancelar edición
    </button>
  )}
</div>

      </form>

      {/* SEARCH */}
      <div className="vehicle-toolbar">
        <input
          placeholder="Buscar por marca, modelo o patente…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="vehicle-table-wrapper">
        <div className="vehicle-table-scroll">
          <table className="vehicle-table">
            <thead>
              <tr>
                <th>Patente</th>
                <th>Vehículo</th>
                <th>Año</th>
                <th>Estado</th>
                <th>Publicado</th>
                {isAdmin && <th>Ingreso</th>}
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredVehicles.map((v) => (
                <tr key={v.id} className={v.isSold ? "sold-row" : ""}>
                  <td className="plate">{v.plate}</td>
                  <td>{v.brand} {v.model}</td>
                  <td>{v.year}</td>

                  <td>
                    {v.sold ? (
                      <span className="badge sold">Vendido</span>
                    ) : (
                      <span className="badge available">Disponible</span>
                    )}
                  </td>

                  <td>
                    {v.linked ? (
                      <span className="badge published">
                        <Check size={14} /> Publicado
                      </span>
                    ) : (
                      <span className="badge unpublished">
                        <X size={14} /> No publicado
                      </span>
                    )}
                  </td>

                  {isAdmin && <td>${v.purchase_price}</td>}

                  <td className="actions">
                    {!v.isSold && (
                      <>
                        <button
                          className="btn edit"
                          onClick={() => {
                            setEditingVehicle(v);
                            setForm({ ...EMPTY_FORM, ...v });

                            setTimeout(() => {
                              formRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }, 100);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="btn expenses"
                          onClick={() => {
                            setExpensesVehicleId(v.id);
                            loadExpenses(v.id);

                            setTimeout(() => {
                              expensesRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }, 150);
                          }}
                        >
                          Gastos
                        </button>
                      </>
                    )}

                    {v.isSold && (
                      <span className="sold-locked">
                        Vehículo vendido
                      </span>
                    )}

                    {isAdmin && v.isSold && (
                      <button
                        className="btn danger"
                        onClick={() => deleteVehicle(v)}
                      >
                        Eliminar vendido
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXPENSES (igual que antes) */}
      {expensesVehicleId && (
        <div ref={expensesRef} className="expense-box">
          <header className="expense-header">
            <h3>
              Gastos del vehículo – {activeVehicle?.plate} –{" "}
              {activeVehicle?.brand} {activeVehicle?.model}
            </h3>

            <button
              className="close-expenses"
              onClick={() => {
                setExpensesVehicleId(null);
                setExpenses([]);
                setExpense({ description: "", amount: "" });

                setTimeout(() => {
                  formRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }, 100);
              }}
            >
              ✕
            </button>
          </header>

          {expenses.map(e => (
            <div key={e.id} className="expense-row">
              <span>{e.description}</span>
              <strong>${e.amount}</strong>

              <button
                className="btn danger small"
                onClick={() => {
                  toast("¿Eliminar gasto?", {
                    description: "Esta acción no se puede deshacer",
                    action: {
                      label: "Eliminar",
                      onClick: () => deleteExpense(e.id),
                    },
                    cancel: { label: "Cancelar" },
                  });
                }}
              >
                Eliminar
              </button>
            </div>
          ))}

          <input
            placeholder="Descripción"
            value={expense.description}
            onChange={e => setExpense({ ...expense, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Monto"
            value={expense.amount}
            onChange={e => setExpense({ ...expense, amount: e.target.value })}
          />
          <button className="button-gasto" onClick={addExpense}>
            Agregar gasto
          </button>
        </div>
      )}
    </div>
  );
}

export default VehicleEntry;
