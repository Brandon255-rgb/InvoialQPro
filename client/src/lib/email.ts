import { apiRequest } from "./queryClient";
import { generateInvoicePdf, revokeBlobUrl } from "./pdf";

/**
 * Sends an invoice via email
 * 
 * @param invoiceId The ID of the invoice to send
 * @param recipientEmail The email address to send the invoice to
 * @returns A Promise that resolves when the email is sent
 */
export const sendInvoiceEmail = async (
  invoiceId: number,
  recipientEmail: string
): Promise<void> => {
  try {
    // Call the API to send the invoice
    await apiRequest("POST", `/api/invoices/${invoiceId}/send`, {
      recipientEmail,
    });
  } catch (error) {
    console.error("Error sending invoice email:", error);
    throw new Error("Failed to send invoice email");
  }
};

/**
 * Downloads an invoice PDF
 * 
 * @param invoiceId The ID of the invoice to download
 * @param autoDownload Whether to automatically download the PDF or just return the URL
 * @returns A Promise that resolves with the PDF URL if autoDownload is false
 */
export const downloadInvoicePdf = async (
  invoiceId: number,
  autoDownload: boolean = true
): Promise<string> => {
  try {
    // Get PDF as blob
    const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    if (autoDownload) {
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    }
    
    return url;
  } catch (error) {
    console.error("Error downloading invoice PDF:", error);
    throw new Error("Failed to download invoice PDF");
  }
};

/**
 * Schedules an invoice to be sent at a later time
 * 
 * @param invoiceId The ID of the invoice to schedule
 * @param recipientEmail The email address to send the invoice to
 * @param scheduledDate The date and time to send the invoice
 * @returns A Promise that resolves when the schedule is set
 */
export const scheduleInvoiceEmail = async (
  invoiceId: number,
  recipientEmail: string,
  scheduledDate: Date
): Promise<void> => {
  try {
    await apiRequest("POST", `/api/invoices/${invoiceId}/schedule`, {
      recipientEmail,
      scheduledDate: scheduledDate.toISOString(),
    });
  } catch (error) {
    console.error("Error scheduling invoice email:", error);
    throw new Error("Failed to schedule invoice email");
  }
};
