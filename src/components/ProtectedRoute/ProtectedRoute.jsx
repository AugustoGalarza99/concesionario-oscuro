import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import Loader from "../Loader/Loader";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, dealershipRole, authLoading } = useAuth();
  const location = useLocation();

  // 🔒 Evita mostrar el mismo toast varias veces
  const toastShown = useRef(false);

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
  }, [user, dealershipRole, authLoading, allowedRoles]);

  if (authLoading) return <Loader />;

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
