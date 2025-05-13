/**
 * PDF generation service for creating invoice PDFs.
 * This service uses a simple approach to generate PDFs.
 * In a production environment, this would be integrated with a proper PDF generator like PDFKit or html-pdf.
 */

import PDFDocument from 'pdfkit';
import { Invoice, Client, InvoiceItem } from '@shared/schema';
import fs from 'fs';
import path from 'path';

/**
 * Generates an invoice PDF
 * 
 * @param data Invoice data including invoice, items, client, and company information
 * @returns A Buffer containing the PDF data
 */
export async function generateInvoicePdf(invoice: Invoice, client: Client, items: InvoiceItem[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('INVOICE', { align: 'center' });
      doc.moveDown();

      // Invoice Details
      doc.fontSize(12);
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
      doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`);
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
      doc.moveDown();

      // Client Details
      doc.text('Bill To:');
      doc.text(client.name);
      if (client.company) doc.text(client.company);
      doc.text(client.address || '');
      doc.text(client.email);
      doc.moveDown();

      // Items Table
      const tableTop = doc.y;
      const tableLeft = 50;
      const tableWidth = 500;
      const columnWidth = tableWidth / 4;

      // Table Header
      doc.text('Description', tableLeft, tableTop);
      doc.text('Quantity', tableLeft + columnWidth, tableTop);
      doc.text('Price', tableLeft + columnWidth * 2, tableTop);
      doc.text('Total', tableLeft + columnWidth * 3, tableTop);
      doc.moveDown();

      // Table Rows
      let y = doc.y;
      items.forEach(item => {
        doc.text(item.description, tableLeft, y);
        doc.text(item.quantity.toString(), tableLeft + columnWidth, y);
        doc.text(`$${item.price.toFixed(2)}`, tableLeft + columnWidth * 2, y);
        doc.text(`$${item.total.toFixed(2)}`, tableLeft + columnWidth * 3, y);
        y += 20;
      });

      // Totals
      doc.moveDown();
      doc.text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, { align: 'right' });
      if (invoice.tax) doc.text(`Tax: $${invoice.tax.toFixed(2)}`, { align: 'right' });
      if (invoice.discount) doc.text(`Discount: $${invoice.discount.toFixed(2)}`, { align: 'right' });
      doc.text(`Total: $${invoice.total.toFixed(2)}`, { align: 'right' });

      // Footer
      doc.fontSize(10);
      doc.text('Thank you for your business!', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
