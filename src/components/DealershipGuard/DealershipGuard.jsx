import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDealership } from "../../hooks/useDealership";
import { toast } from "sonner";

export default function DealershipGuard({ children }) {

  const { dealership, loading } = useDealership();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {

    if (loading) return;

    if (dealership?.active === false) {

      // si está en cualquier ruta admin lo sacamos
      if (location.pathname.startsWith("/admin")) {

        toast.error("Sistema suspendido por falta de pago");

        navigate("/", { replace: true });
      }

    }

  }, [dealership?.active, loading, location.pathname]);

  return children;
}