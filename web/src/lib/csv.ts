type Cell = string | number | null | undefined;

function escapeCell(value: Cell): string {
  if (value == null) return '';
  let s = String(value);
  // Neutralize spreadsheet formula injection from customer-entered fields,
  // but leave plain numbers (e.g. "+15551234567" phone numbers) untouched.
  if (/^[=+\-@\t\r]/.test(s) && !/^[+-]?[\d\s().-]+$/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: Cell[][]): string {
  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n') + '\r\n';
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
