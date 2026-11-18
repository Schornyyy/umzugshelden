/** Deterministischer, schneller Hash (z. B. für pro Stadt unterschiedliche Reihenfolgen). */
export function stableHash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result;
}

/** Rotiert eine Liste deterministisch anhand eines Schlüssels. */
export function rotateBy<T>(items: readonly T[], key: string): T[] {
  if (!items.length) return [];
  const offset = stableHash(key) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}
