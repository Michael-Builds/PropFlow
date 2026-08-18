import type { jsPDF } from 'jspdf';
import { GeneratedAgreement } from '../../interfaces/agreement.interface';

const PDF_FONT = 'Figtree';
const PDF_FONT_FILE = 'Figtree.ttf';
const FONT_PATH = '/fonts/Figtree.ttf';
const LOGO_PATH = '/logo-mark.png';

const BRAND = {
  navy: [15, 16, 53] as [number, number, number],
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

export async function downloadAgreementPdf(agreement: GeneratedAgreement): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const fontReady = await ensureFigtreeFont(doc);
  const font = fontReady ? PDF_FONT : 'helvetica';
  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;

  let y = await drawHeader(doc, agreement, margin, fontReady);

  doc.setFont(font, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.slate600);
  y = writeParagraph(
    doc,
    'Operational template generated from PropFlow records. Have counsel review before signing. This is not an eviction notice.',
    margin,
    y,
    contentWidth,
    pageHeight,
    font,
    8,
  );
  y += 4;

  doc.setFillColor(...BRAND.soft);
  doc.roundedRect(margin, y, contentWidth, 4 + agreement.parties.length * 6.2, 1.5, 1.5, 'F');
  let partyY = y + 5.5;
  for (const party of agreement.parties) {
    doc.setFont(font, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.slate400);
    doc.text(party.label.toUpperCase(), margin + 4, partyY);
    doc.setFont(font, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.slate900);
    doc.text(clip(doc, party.value, contentWidth - 48, font), margin + 42, partyY);
    partyY += 6.2;
  }
  y = partyY + 6;

  for (const section of agreement.sections) {
    y = ensureSpace(doc, y, 18, margin, pageHeight);
    doc.setFont(font, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.navy);
    doc.text(section.heading, margin, y);
    y += 6;
    doc.setDrawColor(...BRAND.blue);
    doc.setLineWidth(0.4);
    doc.line(margin, y - 4, margin + 18, y - 4);

    for (const paragraph of section.paragraphs) {
      y = writeParagraph(doc, paragraph, margin, y, contentWidth, pageHeight, font, 10);
      y += 3;
    }
    y += 2;
  }

  y = ensureSpace(doc, y, 28 + agreement.signatures.length * 22, margin, pageHeight);
  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.navy);
  doc.text('Signatures', margin, y);
  y += 8;

  const colWidth = (contentWidth - 8) / 2;
  agreement.signatures.forEach((signature, index) => {
    const col = index % 2;
    if (col === 0 && index > 0) y += 22;
    y = ensureSpace(doc, y, 22, margin, pageHeight);
    const x = margin + col * (colWidth + 8);
    doc.setDrawColor(...BRAND.slate200);
    doc.setLineWidth(0.35);
    doc.line(x, y + 10, x + colWidth, y + 10);
    doc.setFont(font, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.slate600);
    doc.text(signature.role, x, y + 15);
    doc.setTextColor(...BRAND.slate400);
    doc.text(signature.name, x, y + 19.5);
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...BRAND.slate200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFont(font, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.slate400);
    doc.text('PropFlow · Generated agreement', margin, pageHeight - 7);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  doc.save(`${agreement.filename}.pdf`);
}

async function drawHeader(
  doc: jsPDF,
  agreement: GeneratedAgreement,
  margin: number,
  fontReady: boolean,
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const bandHeight = 28;
  const font = fontReady ? PDF_FONT : 'helvetica';

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
  doc.text(agreement.issuedBy, pageWidth - margin, 14.5, { align: 'right' });

  let y = bandHeight + 14;
  doc.setFont(font, 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BRAND.slate900);
  const titleLines = doc.splitTextToSize(agreement.title, pageWidth - margin * 2) as string[];
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7;

  if (agreement.subtitle) {
    doc.setFont(font, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.slate600);
    doc.text(agreement.subtitle, margin, y);
    y += 6;
  }

  doc.setDrawColor(...BRAND.slate200);
  doc.setLineWidth(0.45);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  return y + 10;
}

function writeParagraph(
  doc: jsPDF,
  text: string,
  margin: number,
  y: number,
  width: number,
  pageHeight: number,
  font: string,
  fontSize: number,
): number {
  doc.setFont(font, 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(...BRAND.slate900);
  const lines = doc.splitTextToSize(text, width) as string[];
  const lineHeight = fontSize * 0.42;
  for (const line of lines) {
    y = ensureSpace(doc, y, lineHeight + 2, margin, pageHeight);
    doc.text(line, margin, y);
    y += lineHeight;
  }
  return y;
}

function ensureSpace(doc: jsPDF, y: number, needed: number, margin: number, pageHeight: number): number {
  if (y + needed <= pageHeight - 18) return y;
  doc.addPage();
  return margin + 8;
}

function clip(doc: jsPDF, value: string, width: number, font: string): string {
  doc.setFont(font, 'normal');
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(value, width) as string[];
  return lines[0] ?? '';
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
    if (!logoCache) logoCache = await loadImageMeta(LOGO_PATH);
    return logoCache;
  } catch {
    return null;
  }
}
