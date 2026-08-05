export type ProductImageFile = {
  name: string;
  type: string;
  size: number;
};

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_FILES = 8;
const MAX_BYTES_PER_FILE = 5 * 1024 * 1024;

/** Returns operator-safe validation messages for public catalogue images. */
export function validateProductImageFiles(
  files: readonly ProductImageFile[],
): string[] {
  const errors: string[] = [];
  if (files.length > MAX_FILES) {
    errors.push("Select no more than " + MAX_FILES + " images at a time.");
  }
  for (const file of files) {
    if (!ACCEPTED_TYPES.has(file.type)) {
      errors.push(file.name + " must be a JPEG, PNG, WebP, or AVIF image.");
    } else if (file.size > MAX_BYTES_PER_FILE) {
      errors.push(file.name + " must be 5 MB or smaller.");
    }
  }
  return errors;
}
