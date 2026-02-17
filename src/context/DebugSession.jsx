import { useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function DebugSession() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      console.log("SESSION:", data.session);
    });
  }, []);

  return <p>Debug sesión</p>;
}
