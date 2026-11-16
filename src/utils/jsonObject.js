/**
 * MySQL JSON values can arrive as strings depending on driver/query mode.
 * Normalize to plain objects; never spread string characters as keys.
 */
export function jsonObject(value) {
  let current = value;
  for (let pass = 0; pass < 2 && typeof current === 'string'; pass++) {
    try { current = JSON.parse(current); } catch { return {}; }
  }
  return current && typeof current === 'object' && !Array.isArray(current) ? current : {};
}

/** Keep only known document categories, omitting numeric keys from old bad imports. */
export function knownKeys(value, allowed) {
  const input = jsonObject(value);
  return Object.fromEntries(allowed.filter((key) => Object.hasOwn(input, key) &&
    typeof input[key] === 'string' && input[key].length > 0).map((key) => [key, input[key]]));
}
