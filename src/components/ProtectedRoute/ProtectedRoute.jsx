import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { useDealership } from "../../hooks/useDealership";
import Loader from "../Loader/Loader";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, dealershipRole, authLoading } = useAuth();
  const { dealership, loading: dealershipLoading } = useDealership();
  const location = useLocation();
  const navigate = useNavigate();

  const toastShown = useRef(false);

  const isActive = dealership?.active === true;

  useEffect(() => {

    if (dealershipLoading) return;

    if (dealership && dealership.active === false) {

      toast.error("Sistema suspendido por falta de pago");

      // 🔥 si estamos en admin lo sacamos inmediatamente
      if (location.pathname.startsWith("/admin")) {
        navigate("/", { replace: true });
      }

    }

  }, [dealership?.active, dealershipLoading, location.pathname]);
  
  // 🔥 resetear toast si cambia active
  useEffect(() => {
    toastShown.current = false;
  }, [dealership?.active]);

  useEffect(() => {

    if (toastShown.current) return;

    // 🚫 No logueado
    if (!authLoading && !user) {
      toast.error("Tenés que iniciar sesión para acceder");
      toastShown.current = true;
    }

    // 🔐 Sin permisos
    if (
      !authLoading &&
      user &&
      allowedRoles &&
      dealershipRole &&
      !allowedRoles.includes(dealershipRole)
    ) {
      toast.error("No tenés permisos para acceder a esta sección");
      toastShown.current = true;
    }

  }, [user, dealershipRole, authLoading, allowedRoles, dealership, dealershipLoading]);

  if (authLoading) return <Loader />;
  if (dealershipLoading) return <Loader />;

  // 🚫 No logueado
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // ⛔ Sistema suspendido
  if (!isActive) {
    return <Navigate to="/" replace />;
  }

  // 🔐 Sin permisos
  if (allowedRoles && dealershipRole === null) {
    return <Loader />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(dealershipRole)
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}