import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function useDealershipBySlug(slug) {
  const [dealership, setDealership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let active = true;

    const fetchDealership = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("dealerships")
        .select("id, name, slug")
        .eq("slug", slug)
        .maybeSingle(); // 🔥 CLAVE

      if (!active) return;

      if (error) {
        console.error("Error cargando dealership:", error);
        setDealership(null);
      } else {
        setDealership(data);
      }

      setLoading(false);
    };

    fetchDealership();
    return () => { active = false; };
  }, [slug]);

  return { dealership, loading };
}
