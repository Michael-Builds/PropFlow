export async function rowsToPdf(
  title: string,
  headers: string[],
  rows: Record<string, string | number>[],
): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFDocument = require('pdfkit');
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text(title, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#666').text(`Generated ${new Date().toISOString().slice(0, 10)}`);
    doc.moveDown();
    doc.fillColor('#000');

    const colWidth = Math.max(60, Math.floor(520 / Math.max(headers.length, 1)));
    let y = doc.y;
    doc.font('Helvetica-Bold');
    headers.forEach((header: string, i: number) => {
      doc.text(header, 40 + i * colWidth, y, { width: colWidth - 4, continued: false });
    });
    y += 16;
    doc.moveTo(40, y).lineTo(560, y).stroke('#ccc');
    y += 8;
    doc.font('Helvetica');

    for (const row of rows) {
      if (y > 760) {
        doc.addPage();
        y = 40;
      }
      const startY = y;
      let maxH = 12;
      headers.forEach((header: string, i: number) => {
        const value = String(row[header] ?? '');
        const h = doc.heightOfString(value, { width: colWidth - 4 });
        maxH = Math.max(maxH, h);
        doc.text(value, 40 + i * colWidth, startY, { width: colWidth - 4 });
      });
      y = startY + maxH + 6;
    }

    doc.end();
  });
}
