import type { SupabaseClient } from "@supabase/supabase-js";

export const IMAGE_BUCKET = "smart-menu-images";
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 Mo
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/** Valide un fichier image avant upload */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Format accepté : JPG, PNG, WebP ou GIF";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "Image trop lourde (max 5 Mo)";
  }
  return null;
}

function getExtension(file: File): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[file.type] ?? "jpg";
}

/** Upload une image dans Supabase Storage et retourne l'URL publique */
export async function uploadImage(
  supabase: SupabaseClient,
  file: File,
  storagePath: string
): Promise<{ url: string | null; error: string | null }> {
  const validationError = validateImageFile(file);
  if (validationError) {
    return { url: null, error: validationError };
  }

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (error) {
    return { url: null, error: error.message };
  }

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(storagePath);
  return { url: `${data.publicUrl}?t=${Date.now()}`, error: null };
}

/** Chemin storage pour le logo du restaurant */
export function logoStoragePath(restaurantId: string, file: File): string {
  return `${restaurantId}/logo.${getExtension(file)}`;
}

/** Chemin storage pour la photo d'un plat */
export function menuItemStoragePath(
  restaurantId: string,
  itemId: string,
  file: File
): string {
  return `${restaurantId}/items/${itemId}.${getExtension(file)}`;
}
