/**
 * Email service for sending invoice emails.
 * In a production environment, this would be integrated with SendGrid, Mailgun, etc.
 */

interface EmailOptions {
  recipientEmail: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

/**
 * Sends an email with the given options
 * 
 * @param options The email options including recipient, subject, and HTML content
 * @returns A Promise that resolves when the email is sent
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log("Sending email to:", options.recipientEmail);
    console.log("Subject:", options.subject);
    
    // In a real implementation, this would use SendGrid or another email service
    // For development purposes, we'll just log the email content
    console.log("Email sent successfully!");
    
    // Always return true for development purposes
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Sends an invoice email
 * 
 * @param recipientEmail The email address to send the invoice to
 * @param invoice The invoice object
 * @param pdfBuffer The invoice PDF as a buffer
 * @param company The company information
 * @returns A Promise that resolves when the email is sent
 */
export async function sendInvoiceEmail({
  recipientEmail,
  invoice,
  pdfBuffer,
  company,
}: {
  recipientEmail: string;
  invoice: any;
  pdfBuffer: Buffer;
  company: {
    name: string;
    email: string;
    phone?: string; // Make phone optional
  };
}): Promise<boolean> {
  const subject = `Invoice #${invoice.invoiceNumber} from ${company.name}`;
  
  // Simple HTML email template
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Invoice #${invoice.invoiceNumber}</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Dear Client,</p>
        
        <p>Please find attached your invoice #${invoice.invoiceNumber} for the amount of $${invoice.total.toFixed(2)}.</p>
        
        <p>Due date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
        
        <p>If you have any questions regarding this invoice, please contact us at ${company.email}.</p>
        
        <p>Thank you for your business!</p>
        
        <p>Best regards,<br>${company.name}</p>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>This email was sent from InvoaIQ, an online invoicing platform.</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    recipientEmail,
    subject,
    html,
    attachments: [
      {
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
