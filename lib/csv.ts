// Shared CSV export used by every page's More menu.
export type CsvCell = string | number | boolean | null | undefined;

export function toCsv(rows: CsvCell[][]): string {
  const cell = (v: CsvCell) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(cell).join(",")).join("\n");
}

/** Builds the CSV and triggers a download in the browser. */
export function downloadCsv(filename: string, rows: CsvCell[][]): void {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
