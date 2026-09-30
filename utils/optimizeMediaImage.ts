const MAX_IMAGE_EDGE = 2560;
const MAX_WEBP_BYTES = 2_500_000;
const INITIAL_WEBP_QUALITY = 0.82;
const FALLBACK_WEBP_QUALITY = 0.68;

type OptimizedMediaFile = {
  file: File;
  width?: number;
  height?: number;
};

function encodeWebp(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Das Bild konnte nicht als WebP kodiert werden."));
      },
      "image/webp",
      quality,
    );
  });
}

export async function optimizeMediaFile(
  sourceFile: File,
): Promise<OptimizedMediaFile> {
  if (!sourceFile.type.startsWith("image/")) {
    return { file: sourceFile };
  }
  if (sourceFile.size > 25 * 1024 * 1024) {
    throw new Error("Das Bild darf vor der Komprimierung maximal 25 MB groß sein.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(sourceFile, {
      imageOrientation: "from-image",
    });
  } catch {
    throw new Error("Dieses Bildformat kann nicht verarbeitet werden.");
  }

  try {
    const scale = Math.min(
      1,
      MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("Bildverarbeitung ist nicht verfügbar.");

    context.drawImage(bitmap, 0, 0, width, height);
    let blob = await encodeWebp(canvas, INITIAL_WEBP_QUALITY);
    if (blob.size > MAX_WEBP_BYTES) {
      blob = await encodeWebp(canvas, FALLBACK_WEBP_QUALITY);
    }

    const baseName = sourceFile.name.replace(/\.[^.]+$/, "").trim() || "bild";
    return {
      file: new File([blob], `${baseName}.webp`, {
        type: "image/webp",
        lastModified: Date.now(),
      }),
      width,
      height,
    };
  } finally {
    bitmap.close();
  }
}