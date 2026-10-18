/**
 * Deterministic pseudo-random numbers (docs/00-global.md §3).
 * The same (crop, salt, day) must always produce the same price on every
 * machine, so the hash and the generator are written by hand rather than
 * relying on Math.random or on a library's internal string hashing.
 */

/** FNV-1a, 32-bit. Stable across platforms. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: small, fast, and identical everywhere. Returns 0 <= n < 1. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One value for a key, without keeping state between calls. */
export function seededValue(key: string): number {
  return mulberry32(hashString(key))();
}
