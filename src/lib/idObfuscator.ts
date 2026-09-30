import Sqids from "sqids";

const RAW_ALPHABET = "Fx0789bcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456";
const UNIQUE_ALPHABET = Array.from(new Set(RAW_ALPHABET.split(""))).join("");

const sqids = new Sqids({
  minLength: 16,
  alphabet: UNIQUE_ALPHABET,
});

/**
 * Encodes a positive numeric database ID into an obfuscated alphanumeric string.
 */
export function encodeId(id: number | null | undefined): string {
  if (id == null || isNaN(id) || id <= 0) return "";
  return sqids.encode([id]);
}

/**
 * Decodes an obfuscated string token back into the numeric database ID.
 * Supports backward compatibility for plain numeric strings or numbers.
 */
export function decodeId(hash: string | number | null | undefined): number | null {
  if (hash == null) return null;
  if (typeof hash === "number") {
    return isNaN(hash) || hash <= 0 ? null : hash;
  }
  const str = String(hash).trim();
  if (!str) return null;

  // Fallback for legacy plain numeric IDs (e.g., "15" or 15)
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    return num > 0 ? num : null;
  }

  const decoded = sqids.decode(str);
  if (decoded && decoded.length > 0 && decoded[0] > 0) {
    return decoded[0];
  }
  return null;
}
