import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertClientSchema, insertItemSchema, insertInvoiceSchema, insertInvoiceItemSchema, insertReminderSchema } from "@shared/schema";
import { generateInvoicePdf } from "./services/pdf";
import { sendInvoiceEmail } from "./services/email";

// Helper function to parse params
const getIdParam = (req: Request): number => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new Error("Invalid ID parameter");
  }
  return id;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const user = await storage.createUser(userData);
      
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Don't return the password in the response
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Client routes
  app.get("/api/clients", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid userId is required" });
      }
      
      const clients = await storage.getClientsByUserId(userId);
      res.status(200).json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.status(200).json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req: Request, res: Response) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const clientData = req.body;
      
      const updatedClient = await storage.updateClient(id, clientData);
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.status(200).json(updatedClient);
    } catch (error) {
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const success = await storage.deleteClient(id);
      
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Item routes
  app.get("/api/items", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid userId is required" });
      }
      
      const items = await storage.getItemsByUserId(userId);
      res.status(200).json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const item = await storage.getItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.status(200).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post("/api/items", async (req: Request, res: Response) => {
    try {
      const itemData = insertItemSchema.parse(req.body);
      const item = await storage.createItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  app.put("/api/items/:id", async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const itemData = req.body;
      
      const updatedItem = await storage.updateItem(id, itemData);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.status(200).json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  app.delete("/api/items/:id", async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const success = await storage.deleteItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid userId is required" });
      }
      
      const invoices = await storage.getInvoicesByUserId(userId);
      res.status(200).json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Get invoice items as well
      const invoiceItems = await storage.getInvoiceItemsByInvoiceId(id);
      
      res.status(200).json({
        ...invoice,
        items: invoiceItems
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req: Request, res: Response) => {
    try {
      const { invoice, items } = req.body;
      
      // Validate invoice data
      const invoiceData = insertInvoiceSchema.parse(invoice);
      
      // Create invoice
      const createdInvoice = await storage.createInvoice(invoiceData);
      
      // Create invoice items
      const createdItems = [];
      for (const item of items) {
        const invoiceItemData = {
          ...item,
          invoiceId: createdInvoice.id
        };
        
        const invoiceItem = await storage.createInvoiceItem(invoiceItemData);
        createdItems.push(invoiceItem);
      }
      
      res.status(201).json({
        ...createdInvoice,
        items: createdItems
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const { invoice, items } = req.body;
      
      // Update invoice
      const updatedInvoice = await storage.updateInvoice(id, invoice);
      
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Handle invoice items
      if (items && Array.isArray(items)) {
        // Get existing items
        const existingItems = await storage.getInvoiceItemsByInvoiceId(id);
        
        // Delete items not in the new list
        for (const existingItem of existingItems) {
          const itemExists = items.some((item: any) => 
            item.id && item.id === existingItem.id
          );
          
          if (!itemExists) {
            await storage.deleteInvoiceItem(existingItem.id);
          }
        }
        
        // Update or create items
        for (const item of items) {
          if (item.id) {
            // Update existing item
            await storage.updateInvoiceItem(item.id, item);
          } else {
            // Create new item
            await storage.createInvoiceItem({
              ...item,
              invoiceId: id
            });
          }
        }
      }
      
      // Get updated items
      const updatedItems = await storage.getInvoiceItemsByInvoiceId(id);
      
      res.status(200).json({
        ...updatedInvoice,
        items: updatedItems
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const success = await storage.deleteInvoice(id);
      
      if (!success) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Generate PDF
  app.get("/api/invoices/:id/pdf", async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Get invoice items
      const invoiceItems = await storage.getInvoiceItemsByInvoiceId(id);
      
      // Get client information
      const client = await storage.getClient(invoice.clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Get user (company) information
      const user = await storage.getUser(invoice.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate PDF
      const pdfBuffer = await generateInvoicePdf({
        invoice,
        items: invoiceItems,
        client,
        company: {
          name: user.company || user.name,
          email: user.email,
          address: user.address || ''
        }
      });
      
      // Set headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      
      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Send invoice via email
  app.post("/api/invoices/:id/send", async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const { recipientEmail } = req.body;
      
      if (!recipientEmail) {
        return res.status(400).json({ message: "Recipient email is required" });
      }
      
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Get invoice items
      const invoiceItems = await storage.getInvoiceItemsByInvoiceId(id);
      
      // Get client information
      const client = await storage.getClient(invoice.clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Get user (company) information
      const user = await storage.getUser(invoice.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate PDF
      const pdfBuffer = await generateInvoicePdf({
        invoice,
        items: invoiceItems,
        client,
        company: {
          name: user.company || user.name,
          email: user.email,
          address: user.address || ''
        }
      });
      
      // Send email
      await sendInvoiceEmail({
        recipientEmail,
        invoice,
        pdfBuffer,
        company: {
          name: user.company || user.name,
          email: user.email
        }
      });
      
      // Update invoice status if it's still in draft
      if (invoice.status === 'draft') {
        await storage.updateInvoice(id, { status: 'sent' });
      }
      
      res.status(200).json({ message: "Invoice sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send invoice" });
    }
  });

  // Reminder routes
  app.get("/api/reminders", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid userId is required" });
      }
      
      const reminders = await storage.getRemindersByUserId(userId);
      res.status(200).json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", async (req: Request, res: Response) => {
    try {
      const reminderData = insertReminderSchema.parse(req.body);
      const reminder = await storage.createReminder(reminderData);
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.put("/api/reminders/:id", async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const reminderData = req.body;
      
      const updatedReminder = await storage.updateReminder(id, reminderData);
      
      if (!updatedReminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      res.status(200).json(updatedReminder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update reminder" });
    }
  });

  app.delete("/api/reminders/:id", async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const success = await storage.deleteReminder(id);
      
      if (!success) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/dashboard", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid userId is required" });
      }
      
      // Get basic stats
      const totalRevenue = await storage.getTotalRevenue(userId);
      const outstandingAmount = await storage.getOutstandingAmount(userId);
      const activeClientsCount = await storage.getActiveClientsCount(userId);
      const itemsInStockCount = await storage.getItemsInStockCount(userId);
      
      // Get monthly revenue for the current year
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = await storage.getRevenueByMonth(userId, currentYear);
      
      // Get invoice status summary
      const invoiceStatusSummary = await storage.getInvoiceStatusSummary(userId);
      
      // Get top clients
      const topClients = await storage.getTopClients(userId, 3);
      
      // Get upcoming reminders
      const allReminders = await storage.getRemindersByUserId(userId);
      const upcomingReminders = allReminders
        .filter(reminder => !reminder.isCompleted && reminder.dueDate > new Date())
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        .slice(0, 3);
      
      // Get recent invoices
      const allInvoices = await storage.getInvoicesByUserId(userId);
      const recentInvoices = [];
      
      for (const invoice of allInvoices
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 3)) {
        
        const client = await storage.getClient(invoice.clientId);
        
        if (client) {
          recentInvoices.push({
            ...invoice,
            client: {
              id: client.id,
              name: client.name,
              company: client.company
            }
          });
        }
      }
      
      res.status(200).json({
        stats: {
          totalRevenue,
          outstandingAmount,
          activeClientsCount,
          itemsInStockCount
        },
        monthlyRevenue,
        invoiceStatusSummary,
        topClients,
        upcomingReminders,
        recentInvoices
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
