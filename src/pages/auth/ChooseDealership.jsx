import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";

function ChooseDealership() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dealerships, setDealerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadDealerships = async () => {
      const { data, error } = await supabase
        .from("dealerships")
        .select("id, name");

      if (error) {
        setError("Error cargando concesionarios");
      } else {
        setDealerships(data);
      }

      setLoading(false);
    };

    loadDealerships();
  }, [user]);

  const handleJoin = async (dealershipId) => {
    setError("");

    const { error } = await supabase.rpc("join_dealership", {
      p_dealership_id: dealershipId,
    });

    if (error) {
      setError("No se pudo asociar al concesionario");
      return;
    }

    navigate("/perfil");
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h2>Elegí tu concesionario</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {dealerships.map((d) => (
          <li key={d.id}>
            <button onClick={() => handleJoin(d.id)}>
              {d.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChooseDealership;
