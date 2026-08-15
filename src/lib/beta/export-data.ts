export const EXPORT_PAGE_SIZE = 500;
export const EXPORT_IN_CHUNK_SIZE = 100;

export function chunkValues<T>(values: T[], size = EXPORT_IN_CHUNK_SIZE): T[][] {
  if (!Number.isInteger(size) || size < 1) throw new Error('Chunk size must be positive');
  const unique = Array.from(new Set(values));
  const chunks: T[][] = [];
  for (let index = 0; index < unique.length; index += size) chunks.push(unique.slice(index, index + size));
  return chunks;
}
export async function paginateRows<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  pageSize = EXPORT_PAGE_SIZE
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export function dedupeRows<T>(rows: T[], key: (row: T) => string): T[] {
  const byKey = new Map<string, T>();
  for (const row of rows) byKey.set(key(row), row);
  return Array.from(byKey.values());
}
