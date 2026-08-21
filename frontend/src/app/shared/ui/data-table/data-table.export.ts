import type { jsPDF } from 'jspdf';
import { DataTableCellType, DataTableColumn } from '../../../core/interfaces/data-table.interface';
import { formatDisplayDate } from '../../../core/utils';

const PDF_FONT = 'Figtree';
const PDF_FONT_FILE = 'Figtree.ttf';
const FONT_PATH = '/fonts/Figtree.ttf';
const LOGO_PATH = '/logo-mark.png';

const BRAND = {
  navy: [15, 16, 53] as [number, number, number],
  navyMid: [25, 25, 95] as [number, number, number],
  blue: [0, 40, 242] as [number, number, number],
  slate900: [22, 21, 25] as [number, number, number],
  slate600: [96, 96, 107] as [number, number, number],
  slate400: [139, 139, 150] as [number, number, number],
  slate200: [226, 230, 240] as [number, number, number],
  soft: [243, 247, 255] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

let figtreeFontBase64: string | null = null;
let logoCache: { dataUrl: string; aspect: number } | null = null;

function cellType(column: DataTableColumn): DataTableCellType {
  if (column.type) return column.type;
  if (column.key === 'actions') return 'actions';
  return 'text';
}

function exportableColumns(columns: readonly DataTableColumn[]): DataTableColumn[] {
  return columns.filter((column) => cellType(column) !== 'actions');
}

function resolveValue(row: unknown, column: DataTableColumn): unknown {
  if (column.value && row) return column.value(row);
  if (row && typeof row === 'object') {
    return (row as Record<string, unknown>)[column.key];
  }
  return undefined;
}

function formatExportValue(row: unknown, column: DataTableColumn): string {
  const raw = resolveValue(row, column);
  if (raw === null || raw === undefined || raw === '') return '';

  if (cellType(column) === 'date') {
    return formatDisplayDate(raw as string | number | Date);
  }

  return String(raw).replace(/—/g, '').trim();
}

function sanitizeFileName(name: string): string {
  const trimmed = name.trim() || 'propflow-export';
  return trimmed
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function buildRows(columns: readonly DataTableColumn[], data: readonly unknown[]): string[][] {
  const cols = exportableColumns(columns);
  return data.map((row) => cols.map((column) => formatExportValue(row, column)));
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function formatExportTimestamp(): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());
}

async function ensureFigtreeFont(doc: jsPDF): Promise<boolean> {
  try {
    if (!figtreeFontBase64) {
      const response = await fetch(FONT_PATH);
      if (!response.ok) return false;
      figtreeFontBase64 = arrayBufferToBase64(await response.arrayBuffer());
    }

    const fonts = doc.getFontList() as Record<string, unknown>;
    if (!fonts[PDF_FONT]) {
      doc.addFileToVFS(PDF_FONT_FILE, figtreeFontBase64);
      doc.addFont(PDF_FONT_FILE, PDF_FONT, 'normal');
      doc.addFont(PDF_FONT_FILE, PDF_FONT, 'bold');
    }
    return true;
  } catch {
    return false;
  }
}

function loadImageMeta(src: string): Promise<{ dataUrl: string; aspect: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Could not prepare logo image.'));
        return;
      }
      context.drawImage(image, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        aspect: image.naturalHeight / image.naturalWidth || 1,
      });
    };
    image.onerror = () => reject(new Error('Could not load logo image.'));
    image.src = src;
  });
}

async function ensureLogo(): Promise<{ dataUrl: string; aspect: number } | null> {
  try {
    if (!logoCache) {
      logoCache = await loadImageMeta(LOGO_PATH);
    }
    return logoCache;
  } catch {
    return null;
  }
}

async function drawPdfHeader(
  doc: jsPDF,
  tableName: string,
  rowCount: number,
  margin: number,
  fontReady: boolean,
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const bandHeight = 28;
  const font = fontReady ? PDF_FONT : 'helvetica';

  // Brand band
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, 0, pageWidth, bandHeight, 'F');
  doc.setFillColor(...BRAND.blue);
  doc.rect(0, bandHeight - 2.2, pageWidth, 2.2, 'F');

  const logo = await ensureLogo();
  let textX = margin;
  if (logo) {
    const logoH = 12;
    const logoW = logoH / logo.aspect;
    doc.addImage(logo.dataUrl, 'PNG', margin, (bandHeight - 2.2 - logoH) / 2, logoW, logoH);
    textX = margin + logoW + 4;
  }

  doc.setFont(font, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.white);
  doc.text('PropFlow', textX, 11.5);
  doc.setFont(font, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(190, 198, 230);
  doc.text('Property operations', textX, 17.5);

  doc.setFont(font, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(190, 198, 230);
  doc.text(formatExportTimestamp(), pageWidth - margin, 14.5, { align: 'right' });

  let y = bandHeight + 14;

  doc.setFont(font, 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BRAND.slate900);
  doc.text(tableName.trim() || 'Export', margin, y);

  doc.setFont(font, 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND.slate600);
  doc.text(
    `${rowCount} selected record${rowCount === 1 ? '' : 's'} · generated for operational review`,
    margin,
    y + 7,
  );

  doc.setDrawColor(...BRAND.slate200);
  doc.setLineWidth(0.45);
  doc.line(margin, y + 12, pageWidth - margin, y + 12);

  return y + 18;
}

export function downloadDataTableCsv(
  tableName: string,
  columns: readonly DataTableColumn[],
  data: readonly unknown[],
): void {
  const cols = exportableColumns(columns);
  const headers = cols.map((column) => column.header);
  const rows = buildRows(columns, data);

  const escape = (value: string): string => {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csv = [headers, ...rows].map((line) => line.map(escape).join(',')).join('\n');
  const filename = `${sanitizeFileName(tableName)}.csv`;
  downloadBlob(filename, new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
}

export async function downloadDataTablePdf(
  tableName: string,
  columns: readonly DataTableColumn[],
  data: readonly unknown[],
): Promise<void> {
  const cols = exportableColumns(columns);
  const headers = cols.map((column) => column.header);
  const body = buildRows(columns, data);
  const filename = `${sanitizeFileName(tableName)}.pdf`;
  const margin = 14;

  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({
    orientation: (body[0]?.length ?? 0) > 5 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const autoTable = autoTableModule.default;
  const fontReady = await ensureFigtreeFont(doc);
  const font = fontReady ? PDF_FONT : 'helvetica';

  const startY = await drawPdfHeader(doc, tableName, body.length, margin, fontReady);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  autoTable(doc, {
    head: [headers],
    body,
    startY,
    margin: { top: startY, left: margin, right: margin, bottom: 18 },
    theme: 'plain',
    styles: {
      font,
      fontStyle: 'normal',
      fontSize: 8.5,
      cellPadding: { top: 3.4, right: 3.2, bottom: 3.4, left: 3.2 },
      textColor: BRAND.slate900,
      lineColor: BRAND.slate200,
      lineWidth: 0.18,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      font,
      fontStyle: 'bold',
      fontSize: 8,
      fillColor: BRAND.navy,
      textColor: BRAND.white,
      cellPadding: { top: 4.2, right: 3.2, bottom: 4.2, left: 3.2 },
    },
    alternateRowStyles: {
      fillColor: BRAND.soft,
    },
    didDrawPage: (hookData) => {
      // Top accent on continuation pages
      if (hookData.pageNumber > 1) {
        doc.setFillColor(...BRAND.blue);
        doc.rect(0, 0, pageWidth, 1.6, 'F');
      }

      doc.setDrawColor(...BRAND.slate200);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.setFont(font, 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...BRAND.slate400);
      const footerY = pageHeight - 7;
      doc.text('PropFlow · Property operations', margin, footerY);
      doc.text(`Page ${hookData.pageNumber}`, pageWidth - margin, footerY, { align: 'right' });
    },
  });

  doc.save(filename);
}
