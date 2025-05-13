/**
 * Email service for sending invoice emails.
 * In a production environment, this would be integrated with SendGrid, Mailgun, etc.
 */

import nodemailer from 'nodemailer';
import { Invoice, Client } from '@shared/schema';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendInvoiceEmail(invoice: Invoice, client: Client, pdfBuffer: Buffer): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: client.email,
    subject: `Invoice #${invoice.invoiceNumber} from ${process.env.COMPANY_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Invoice #${invoice.invoiceNumber}</h2>
        <p>Dear ${client.name},</p>
        <p>Please find attached your invoice #${invoice.invoiceNumber} for ${invoice.total.toFixed(2)}.</p>
        <p>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
        <p>You can view and pay this invoice online by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_PORTAL_URL}/invoices/${invoice.id}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            View Invoice
          </a>
        </div>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>${process.env.COMPANY_NAME}</p>
      </div>
    `,
    attachments: [
      {
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPaymentReminder(invoice: Invoice, client: Client): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: client.email,
    subject: `Payment Reminder: Invoice #${invoice.invoiceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Reminder</h2>
        <p>Dear ${client.name},</p>
        <p>This is a friendly reminder that invoice #${invoice.invoiceNumber} for ${invoice.total.toFixed(2)} is due on ${new Date(invoice.dueDate).toLocaleDateString()}.</p>
        <p>You can view and pay this invoice online by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_PORTAL_URL}/invoices/${invoice.id}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Pay Now
          </a>
        </div>
        <p>If you have already made this payment, please disregard this reminder.</p>
        <p>Best regards,<br>${process.env.COMPANY_NAME}</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPaymentConfirmation(invoice: Invoice, client: Client): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: client.email,
    subject: `Payment Confirmation: Invoice #${invoice.invoiceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Confirmation</h2>
        <p>Dear ${client.name},</p>
        <p>We have received your payment of ${invoice.total.toFixed(2)} for invoice #${invoice.invoiceNumber}.</p>
        <p>Thank you for your business!</p>
        <p>Best regards,<br>${process.env.COMPANY_NAME}</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
