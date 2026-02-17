import { useDealershipBySlug } from "./useDealershipBySlug";

export function useDealership() {
  const slug = import.meta.env.VITE_DEALERSHIP_SLUG;
  const { dealership, loading } = useDealershipBySlug(slug);

  return {
    dealership,
    dealershipId: dealership?.id ?? null, // 🔥 CLAVE
    loading,
  };
}
