// Utility to convert camelCase to snake_case
export function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = typeof value === 'object' && value !== null ? toSnakeCase(value) : value;
    return acc;
  }, {} as Record<string, any>);
}

// Utility to convert snake_case to camelCase
export function toCamelCase(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = typeof value === 'object' && value !== null ? toCamelCase(value) : value;
    return acc;
  }, {} as Record<string, any>);
} 