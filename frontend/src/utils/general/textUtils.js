/**
 * General String & Case Conversion Utilities
 */

/**
 * Converts snake_case → PascalCase
 * e.g. "vendor_name" -> "VendorName"
 */
export function toPascalCase(str) {
  if (!str) return '';
  return str
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/**
 * Converts camelCase or PascalCase → snake_case
 */
export function toSnakeCase(str) {
  if (!str) return '';
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}
