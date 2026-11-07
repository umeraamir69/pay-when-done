/** Max encoded data-URL length we store on User.image (Postgres text). */
export const AVATAR_MAX_DATA_URL_LENGTH = 350_000;

/**
 * Read an image file, center-crop to square, resize, and return a JPEG data URL
 * suitable for Better Auth `updateUser({ image })`.
 */
export async function fileToAvatarDataUrl(
  file: File,
  opts?: { size?: number; quality?: number },
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file (JPEG, PNG, or WebP).");
  }
  if (file.size > 8_000_000) {
    throw new Error("Image is too large — keep under 8 MB.");
  }

  const size = opts?.size ?? 256;
  const quality = opts?.quality ?? 0.85;

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process image.");

    const minSide = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - minSide) / 2;
    const sy = (bitmap.height - minSide) / 2;
    ctx.drawImage(bitmap, sx, sy, minSide, minSide, 0, 0, size, size);

    let q = quality;
    let dataUrl = canvas.toDataURL("image/jpeg", q);
    while (dataUrl.length > AVATAR_MAX_DATA_URL_LENGTH && q > 0.45) {
      q -= 0.1;
      dataUrl = canvas.toDataURL("image/jpeg", q);
    }
    if (dataUrl.length > AVATAR_MAX_DATA_URL_LENGTH) {
      throw new Error("Could not compress the image enough. Try a smaller photo.");
    }
    return dataUrl;
  } finally {
    bitmap.close();
  }
}

export function initialsFromName(name: string | null | undefined, email?: string | null) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
