import PDFDocument from 'pdfkit';
import { Invoice, InvoiceItem, Client } from '@shared/schema';
import { db } from '../db';
import { companySettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

interface GenerateInvoicePdfOptions {
  invoice: Invoice;
  items: InvoiceItem[];
  client: Client;
  company: {
    name: string;
    email: string;
    address: string;
    phone: string;
  };
}

export async function generateInvoicePdf({
  invoice,
  items,
  client,
  company
}: GenerateInvoicePdfOptions): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Get company settings for logo
      const [settings] = await db.select().from(companySettings).where(eq(companySettings.userId, invoice.userId));
      
      // Add logo if exists
      if (settings?.logoPath) {
        const logoPath = path.join(process.cwd(), settings.logoPath);
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 50, { width: 100 });
          doc.moveDown(2);
        }
      }

      // Company Information
      doc.fontSize(20).text(company.name, { align: 'right' });
      doc.fontSize(10)
        .text(company.address, { align: 'right' })
        .text(`Email: ${company.email}`, { align: 'right' })
        .text(`Phone: ${company.phone}`, { align: 'right' })
        .moveDown();

      // Invoice Information
      doc.fontSize(16).text('INVOICE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10)
        .text(`Invoice Number: ${invoice.invoiceNumber}`)
        .text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`)
        .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`)
        .moveDown();

      // Client Information
      doc.fontSize(12).text('Bill To:', { underline: true });
      doc.fontSize(10)
        .text(client.name)
        .text(client.address)
        .text(`Email: ${client.email}`)
        .text(`Phone: ${client.phone}`)
        .moveDown();

      // Items Table
      const tableTop = doc.y;
      doc.fontSize(10)
        .text('Item', 50, tableTop)
        .text('Quantity', 200, tableTop)
        .text('Price', 300, tableTop)
        .text('Total', 400, tableTop);

      let y = tableTop + 20;
      items.forEach((item) => {
        if (y > 700) { // Check if we need a new page
          doc.addPage();
          y = 50;
        }

        doc.text(item.description, 50, y)
          .text(item.quantity.toString(), 200, y)
          .text(`$${item.unitPrice.toFixed(2)}`, 300, y)
          .text(`$${(item.quantity * item.unitPrice).toFixed(2)}`, 400, y);
        y += 20;
      });

      // Totals
      const totalsY = y + 20;
      doc.fontSize(10)
        .text('Subtotal:', 300, totalsY)
        .text(`$${invoice.subtotal.toFixed(2)}`, 400, totalsY)
        .text('Tax:', 300, totalsY + 20)
        .text(`$${invoice.tax.toFixed(2)}`, 400, totalsY)
        .text('Total:', 300, totalsY + 40)
        .text(`$${invoice.total.toFixed(2)}`, 400, totalsY);

      // Notes
      if (invoice.notes) {
        doc.moveDown(2)
          .fontSize(10)
          .text('Notes:', { underline: true })
          .text(invoice.notes);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
} 