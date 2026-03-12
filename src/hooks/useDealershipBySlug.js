import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function useDealershipBySlug(slug) {

  const [dealership, setDealership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (!slug) return;

    const fetchDealership = async () => {

      const { data } = await supabase
        .from("dealerships")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      setDealership(data);
      setLoading(false);

      if (!data) return;

      const channel = supabase
        .channel("dealership-updates")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "dealerships",
            filter: `id=eq.${data.id}`,
          },
          (payload) => {

            console.log("🔄 realtime dealership", payload.new);

            setDealership(payload.new);
          }
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    };

    fetchDealership();

  }, [slug]);

  return { dealership, loading };

}