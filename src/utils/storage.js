import { supabase } from "../supabaseClient";

export const deleteImagesFromStorage = async (urls = []) => {
  console.log("🗑️ deleteImagesFromStorage called with:", urls);

  const cleanUrls = Array.from(new Set(urls.filter(Boolean)));

  if (!cleanUrls.length) {
    console.warn("⚠️ No hay imágenes para borrar");
    return;
  }

  const paths = cleanUrls
    .map((url) => {
      const marker = "/storage/v1/object/public/products/";
      const idx = url.indexOf(marker);
      if (idx === -1) return null;
      return url.substring(idx + marker.length);
    })
    .filter(Boolean);

  console.log("🗑️ Paths reales a borrar del bucket:", paths);

  if (!paths.length) {
    console.warn("⚠️ No se pudo extraer ningún path válido");
    return;
  }

  const { error } = await supabase
    .storage
    .from("products")
    .remove(paths);

  if (error) {
    console.error("❌ Error borrando imágenes:", error);
    throw error;
  }

  console.log("✅ Imágenes borradas correctamente:", paths);
};
