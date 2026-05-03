export interface ExportColumn {
  header: string;
  accessor: string | ((row: any) => string | number | undefined | null);
  align?: "left" | "right";
}

export interface ExportConfig {
  filename: string;
  title: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  metadata?: Record<string, string>;
}

function resolve(row: Record<string, any>, accessor: ExportColumn["accessor"]): string {
  const v = typeof accessor === "function" ? accessor(row) : row[accessor];
  if (v == null) return "";
  return String(v);
}

function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function exportCSV(config: ExportConfig): void {
  const headerRow = config.columns.map((c) => escapeCSV(c.header)).join(",");
  const dataRows = config.data.map((row) =>
    config.columns.map((c) => escapeCSV(resolve(row, c.accessor))).join(",")
  );
  const csv = [headerRow, ...dataRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${config.filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(config: ExportConfig): void {
  const w = window.open("", "_blank");
  if (!w) return;
  const rows = config.data
    .map(
      (row) =>
        "<tr>" +
        config.columns
          .map(
            (c) =>
              `<td style="padding:4px 8px;border-bottom:1px solid #ddd;text-align:${c.align ?? "left"};font-size:11px;">${resolve(row, c.accessor)}</td>`
          )
          .join("") +
        "</tr>"
    )
    .join("");
  const meta = config.metadata
    ? Object.entries(config.metadata)
        .map(([k, v]) => `<span style="margin-right:16px;"><b>${k}:</b> ${v}</span>`)
        .join("")
    : "";
  w.document.write(`<!doctype html><html><head><title>${config.title}</title>
<style>body{font-family:"JetBrains Mono",monospace;margin:20px;color:#222;}
table{border-collapse:collapse;width:100%;}
th{padding:4px 8px;border-bottom:2px solid #333;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;}
@media print{body{margin:0;}}</style></head><body>
<h2 style="margin:0 0 4px;">${config.title}</h2>
${meta ? `<div style="font-size:11px;color:#666;margin-bottom:12px;">${meta}</div>` : ""}
<table><thead><tr>${config.columns.map((c) => `<th style="text-align:${c.align ?? "left"};">${c.header}</th>`).join("")}</tr></thead>
<tbody>${rows}</tbody></table>
<script>window.print();</script></body></html>`);
  w.document.close();
}
