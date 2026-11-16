// @flow
/**
 * Rebrand the loaded translation catalogs: user-facing strings still say
 * "GDevelop" (upstream brand). We only rewrite the *values* (translations),
 * never the keys (which are the English msgids used for lookups), and we
 * never touch URLs or lowercase technical identifiers like "gdevelop.io".
 */

const BRAND_FROM = /GDevelop/g;
const BRAND_TO = 'VoxForge';

const rebrandValue = (value: any): any => {
  if (typeof value === 'string') return value.replace(BRAND_FROM, BRAND_TO);
  if (Array.isArray(value)) return value.map(rebrandValue);
  if (value && typeof value === 'object') {
    const result = {};
    for (const key of Object.keys(value)) result[key] = rebrandValue(value[key]);
    return result;
  }
  return value;
};

// Для строк без перевода lingui отдаёт исходный английский текст. Подменяем
// бренд и в нём (используется как `missing` в setupI18n).
export const rebrandMissingMessage = (language: string, id: string): string =>
  typeof id === 'string' ? id.replace(BRAND_FROM, BRAND_TO) : id;

export const rebrandCatalog = <T: { messages: Object }>(catalog: T): T => ({
  ...catalog,
  messages: rebrandValue(catalog.messages),
});

export default rebrandCatalog;
