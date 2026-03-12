import { Navigate } from "react-router-dom";
import { useModules } from "../../hooks/useModules";
import { useDealership } from "../../hooks/useDealership";
import { toast } from "sonner";
import { useEffect } from "react";

export default function ModuleGate({ module, children }) {

  const { hasModule } = useModules();
  const { dealership, loading } = useDealership();

  const allowed = hasModule(module);

  useEffect(() => {
    if (!loading && !allowed) {
      toast.error(
        "Este módulo no está incluido en su plan. Contacte a su asesor para activarlo."
      );
    }
  }, [allowed, loading]);

  // ⛔ esperar a que cargue
  if (loading) return null;

  if (!allowed) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}