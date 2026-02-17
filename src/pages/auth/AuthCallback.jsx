import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const finishAuth = async () => {
      // Supabase ya lee el token del hash automáticamente
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        navigate("/choose-dealership", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    };

    finishAuth();
  }, [navigate]);

  return <p>Procesando inicio de sesión...</p>;
}

export default AuthCallback;
