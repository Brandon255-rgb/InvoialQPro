import { apiRequest } from "./queryClient";

/**
 * Generates a PDF for an invoice
 * 
 * @param invoiceId The ID of the invoice to generate a PDF for
 * @returns The URL of the generated PDF
 */
export const generateInvoicePdf = async (invoiceId: number): Promise<string> => {
  try {
    // Get PDF as blob
    const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate PDF: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate invoice PDF');
  }
};

/**
 * Opens a PDF in a new window
 * 
 * @param url The URL of the PDF to open
 */
export const openPdfInNewWindow = (url: string): void => {
  window.open(url, '_blank');
};

/**
 * Downloads a PDF to the user's device
 * 
 * @param url The URL of the PDF to download
 * @param fileName The name to save the file as
 */
export const downloadPdf = (url: string, fileName: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Revokes a blob URL to free up memory
 * 
 * @param url The URL to revoke
 */
export const revokeBlobUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};
