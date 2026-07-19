// Turns nested JSON like { user: { phone: "123" } } into dot-path keys
// like "user.phone", so AutocompleteBox can suggest {user.phone}.
export function flattenObject(
  data: Record<string, any>,
  prefix = "",
  result: Record<string, string> = {},
): Record<string, string> {
  for (const key of Object.keys(data ?? {})) {
    const value = data[key];
    const path = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      flattenObject(value, path, result);
    } else {
      result[path] = String(value);
    }
  }
  return result;
}
