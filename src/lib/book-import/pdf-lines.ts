import type { BookLine } from './index';

/**
 * pdf.js text items → lines (text + print size), as the browser reads a PDF page. Items on the same
 * baseline join into a line (left to right); lines run top to bottom. The line's size is the size
 * of most of its text (not the biggest letter). A drop cap (a lone capital letter printed much
 * bigger, sitting on the 2nd line) is moved to the start of the line above, where it belongs:
 * "lice was…" + "Asister…" → "Alice was…" + "sister…".
 */
export interface TextItem { str: string; transform: number[]; height?: number; width?: number }

export function linesFromTextItems(items: TextItem[]): BookLine[] {
  type Row = { y: number; parts: Array<{ x: number; s: string; size: number; w: number }> };
  const rows: Row[] = [];
  items.forEach((it) => {
    if (!it.str) return;
    const t = it.transform;
    const y = Math.round(t[5]);
    const size = Math.round((Math.hypot(t[2], t[3]) || it.height || 0) * 10) / 10;
    let row = rows.find((r) => Math.abs(r.y - y) <= 2);
    if (!row) { row = { y, parts: [] }; rows.push(row); }
    row.parts.push({ x: t[4], s: it.str, size, w: it.width ?? 0 });
  });
  rows.sort((a, b) => b.y - a.y);

  // The size most of a row's text is set in.
  const mainSize = (parts: Row['parts']) => {
    const bySize: Record<string, number> = {};
    parts.forEach((p) => { bySize[p.size] = (bySize[p.size] ?? 0) + p.s.trim().length; });
    return Number(Object.keys(bySize).sort((a, b) => bySize[b] - bySize[a])[0] ?? 0);
  };

  // Drop caps: a lone capital, much bigger than the rest of its row → prepend to the row above.
  rows.forEach((row, i) => {
    if (row.parts.length < 2) return;
    const size = mainSize(row.parts);
    const k = row.parts.findIndex((p) => /^[A-Z]$/.test(p.s.trim()) && p.size >= size * 1.6);
    if (k < 0 || i === 0) return;
    const [cap] = row.parts.splice(k, 1);
    const above = rows[i - 1];
    const first = above.parts.sort((a, b) => a.x - b.x)[0];
    if (first) first.s = cap.s.trim() + first.s.replace(/^\s+/, '');
  });

  // Join a row's pieces left to right, adding a space where there's a visible gap and no space char.
  const joinRow = (parts: Row['parts']) => {
    const sorted = [...parts].sort((a, b) => a.x - b.x);
    let out = '';
    sorted.forEach((p, i) => {
      if (i > 0) {
        const prev = sorted[i - 1];
        const gap = p.x - (prev.x + prev.w);
        if (prev.w > 0 && gap > p.size * 0.15 && !/\s$/.test(out) && !/^\s/.test(p.s)) out += ' ';
      }
      out += p.s;
    });
    return out.replace(/\s+/g, ' ').trim();
  };
  return rows
    .map((r) => ({ text: joinRow(r.parts), size: mainSize(r.parts) }))
    .filter((l) => l.text);
}
