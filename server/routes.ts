import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertClientSchema, insertItemSchema, insertInvoiceSchema, insertInvoiceItemSchema, insertReminderSchema, InvoiceItem, teamMembers } from "@shared/schema";
import { generateInvoicePdf } from "./services/pdf";
import { sendInvoiceEmail } from "./services/email";
import bcrypt from "bcrypt";
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import paymentRouter from './src/routes/payment';
import { upload, saveFileMetadata, getFileMetadata, deleteFile } from './src/services/upload';
import { companySettings, attachments } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { inviteTeamMember, acceptTeamInvite, getTeamMembers, updateTeamMemberRole, removeTeamMember } from './src/services/team';
import { auditLogs, invoiceTemplates } from '@shared/schema';
import { db } from './src/db';

// Constants
const SALT_ROUNDS = 12; // Industry standard for bcrypt
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Authentication middleware
const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // For now, we'll rely on userId coming from query or body parameters
    // In production, this would use a proper JWT or session-based auth system
    const userId = req.query.userId || req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(Number(userId));
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Attach user to request for use in route handlers
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Authentication error" });
  }
};

// Helper function to parse params
const getIdParam = (req: Request): number => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new Error("Invalid ID parameter");
  }
  return id;
};

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Mock database (replace with actual database in production)
const users: Array<{
  id: string;
  email: string;
  password: string;
}> = [];

const invoices: Array<{
  id: string;
  clientName: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  date: string;
}> = [];

// Auth middleware
const auth = (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware for audit logging
const auditLog = async (req: Request, res: Response, next: NextFunction) => {
  // Only log mutating actions
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const user = (req as any).user;
    if (user) {
      await db.insert(auditLogs).values({
        userId: user.id,
        action: req.method + ' ' + req.path,
        entity: req.path.split('/')[2] || '',
        entityId: req.params.id ? Number(req.params.id) : null,
        timestamp: new Date(),
      });
    }
  }
  next();
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
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({
        ...userWithoutPassword,
        token: Date.now() + TOKEN_EXPIRY // Simple token expiry timestamp
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Use generic error message to prevent email enumeration
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Compare password with hashed password in database
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check if user account is active
      if (user.status !== 'active') {
        return res.status(403).json({ 
          message: "Account is not active", 
          status: user.status 
        });
      }
      
      // Don't return the password in the response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json({
        ...userWithoutPassword,
        token: Date.now() + TOKEN_EXPIRY // Simple token expiry timestamp
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    // In a real implementation with proper sessions or JWT, we would invalidate the token
    // For this simple implementation, we'll just return success
    res.status(200).json({ message: "Logged out successfully" });
  });

  // Add this after the authentication middleware
  app.get("/api/auth/verify", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Session verification error:", error);
      res.status(500).json({ message: "Failed to verify session" });
    }
  });

  // Client routes
  app.get("/api/clients", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const clients = await storage.getClientsByUserId(user.id);
      res.status(200).json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const client = await storage.getClient(id);
      const user = (req as any).user;
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Security check: Only allow users to access their own clients
      if (client.userId !== user.id) {
        return res.status(403).json({ message: "Access denied: You do not have permission to view this client" });
      }
      
      res.status(200).json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const clientData = insertClientSchema.parse({
        ...req.body,
        userId: user.id // Ensure client is created under the authenticated user
      });
      
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const user = (req as any).user;
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Security check: Only allow users to update their own clients
      if (client.userId !== user.id) {
        return res.status(403).json({ message: "Access denied: You do not have permission to update this client" });
      }
      
      const updates = req.body;
      // Prevent changing userId to maintain data integrity
      delete updates.userId;
      
      const updatedClient = await storage.updateClient(id, updates);
      res.status(200).json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const user = (req as any).user;
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Security check: Only allow users to delete their own clients
      if (client.userId !== user.id) {
        return res.status(403).json({ message: "Access denied: You do not have permission to delete this client" });
      }
      
      // Check if client has associated invoices before deletion
      const invoices = await storage.getInvoicesByClientId(id);
      if (invoices.length > 0) {
        return res.status(409).json({ 
          message: "Cannot delete client with active invoices",
          invoiceCount: invoices.length
        });
      }
      
      const success = await storage.deleteClient(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Item routes
  app.get("/api/items", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const items = await storage.getItemsByUserId(user.id);
      res.status(200).json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const item = await storage.getItem(id);
      const user = (req as any).user;
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Security check: Only allow users to access their own items
      if (item.userId !== user.id) {
        return res.status(403).json({ message: "Access denied: You do not have permission to view this item" });
      }
      
      res.status(200).json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post("/api/items", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const itemData = insertItemSchema.parse({
        ...req.body,
        userId: user.id // Ensure item is created under the authenticated user
      });
      
      const item = await storage.createItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  app.put("/api/items/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const user = (req as any).user;
      const item = await storage.getItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Security check: Only allow users to update their own items
      if (item.userId !== user.id) {
        return res.status(403).json({ message: "Access denied: You do not have permission to update this item" });
      }
      
      const updates = req.body;
      // Prevent changing userId to maintain data integrity
      delete updates.userId;
      
      const updatedItem = await storage.updateItem(id, updates);
      res.status(200).json(updatedItem);
    } catch (error) {
      console.error("Error updating item:", error);
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  app.delete("/api/items/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const user = (req as any).user;
      const item = await storage.getItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Security check: Only allow users to delete their own items
      if (item.userId !== user.id) {
        return res.status(403).json({ message: "Access denied: You do not have permission to delete this item" });
      }
      
      // Check if this item is used in any invoices before deletion
      const invoices = await storage.getInvoices();
      const invoiceItems = await storage.getInvoiceItems();
      
      const isItemInUse = invoiceItems.some((invoiceItem: InvoiceItem) => invoiceItem.itemId === id);
      
      if (isItemInUse) {
        return res.status(409).json({ 
          message: "Cannot delete item that is used in existing invoices",
        });
      }
      
      const success = await storage.deleteItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const invoices = await storage.getInvoicesByUserId(user.id);
      
      res.status(200).json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const user = (req as any).user;
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Security check: Only allow users to access their own invoices
      if (invoice.userId !== user.id) {
        return res.status(403).json({ message: "Access denied: You do not have permission to view this invoice" });
      }
      
      // Get invoice items as well
      const invoiceItems = await storage.getInvoiceItemsByInvoiceId(id);
      
      res.status(200).json({
        ...invoice,
        items: invoiceItems
      });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { invoice, items } = req.body;
      
      // For security, enforce that the user ID in the invoice matches the authenticated user
      const invoiceData = insertInvoiceSchema.parse({
        ...invoice,
        userId: user.id // Ensure the invoice belongs to the authenticated user
      });
      
      // Verify the client belongs to the user
      const client = await storage.getClient(invoiceData.clientId);
      if (!client) {
        return res.status(400).json({ message: "Client not found" });
      }
      
      if (client.userId !== user.id) {
        return res.status(403).json({ 
          message: "Access denied: You can only create invoices for your own clients"
        });
      }
      
      // Create invoice
      const createdInvoice = await storage.createInvoice(invoiceData);
      
      // Create invoice items
      const createdItems = [];
      for (const item of items) {
        // If the item has an itemId, verify it belongs to the user
        if (item.itemId) {
          const itemObj = await storage.getItem(item.itemId);
          if (itemObj && itemObj.userId !== user.id) {
            return res.status(403).json({ 
              message: "Access denied: You can only use your own items in invoices"
            });
          }
        }
        
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
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const user = (req as any).user;
      const { invoice, items } = req.body;
      
      // Get the existing invoice
      const existingInvoice = await storage.getInvoice(id);
      if (!existingInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Security check: Only allow users to update their own invoices
      if (existingInvoice.userId !== user.id) {
        return res.status(403).json({ 
          message: "Access denied: You do not have permission to update this invoice"
        });
      }
      
      // Prevent changing userId
      const invoiceUpdates = { ...invoice };
      delete invoiceUpdates.userId;
      
      // If clientId is being updated, verify it belongs to the user
      if (invoiceUpdates.clientId && invoiceUpdates.clientId !== existingInvoice.clientId) {
        const client = await storage.getClient(invoiceUpdates.clientId);
        if (!client) {
          return res.status(400).json({ message: "Client not found" });
        }
        
        if (client.userId !== user.id) {
          return res.status(403).json({ 
            message: "Access denied: You can only use your own clients in invoices"
          });
        }
      }
      
      // Update invoice
      const updatedInvoice = await storage.updateInvoice(id, invoiceUpdates);
      
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

  app.delete("/api/invoices/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const user = (req as any).user;
      
      // Get the invoice before deletion to verify ownership
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Security check: Only allow users to delete their own invoices
      if (invoice.userId !== user.id) {
        return res.status(403).json({ 
          message: "Access denied: You do not have permission to delete this invoice"
        });
      }
      
      // Check if invoice can be deleted (e.g., only if it's in draft status)
      if (invoice.status === "paid") {
        return res.status(400).json({ 
          message: "Cannot delete a paid invoice. Consider canceling it instead."
        });
      }
      
      const success = await storage.deleteInvoice(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Generate PDF
  app.get("/api/invoices/:id/pdf", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const user = (req as any).user;
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Security check: Only allow users to access their own invoices
      // We'll make a small exception here to allow viewing PDFs for invoices sent to you as a client
      // (would be implemented in a real app with client access)
      if (invoice.userId !== user.id) {
        // In a real app with client login, we'd check if the current user is the client for this invoice
        // For now, restrict to only the owner
        return res.status(403).json({ 
          message: "Access denied: You do not have permission to view this invoice PDF"
        });
      }
      
      // Get invoice items
      const invoiceItems = await storage.getInvoiceItemsByInvoiceId(id);
      
      // Get client information
      const client = await storage.getClient(invoice.clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Get user (company) information
      const invoiceUser = await storage.getUser(invoice.userId);
      
      if (!invoiceUser) {
        return res.status(404).json({ message: "Company information not found" });
      }
      
      // Generate PDF
      const pdfBuffer = await generateInvoicePdf({
        invoice,
        items: invoiceItems,
        client,
        company: {
          name: invoiceUser.company || invoiceUser.name,
          email: invoiceUser.email,
          address: invoiceUser.address || '',
          phone: invoiceUser.phone || ''
        }
      });
      
      // Set headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      
      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Send invoice via email
  app.post("/api/invoices/:id/send", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const user = (req as any).user;
      const { recipientEmail } = req.body;
      
      if (!recipientEmail) {
        return res.status(400).json({ message: "Recipient email is required" });
      }
      
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Security check: Only allow users to send their own invoices
      if (invoice.userId !== user.id) {
        return res.status(403).json({ 
          message: "Access denied: You do not have permission to send this invoice"
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // Get invoice items
      const invoiceItems = await storage.getInvoiceItemsByInvoiceId(id);
      
      // Get client information
      const client = await storage.getClient(invoice.clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Get user (company) information
      const invoiceUser = await storage.getUser(invoice.userId);
      
      if (!invoiceUser) {
        return res.status(404).json({ message: "Company information not found" });
      }
      
      // Generate PDF
      const pdfBuffer = await generateInvoicePdf({
        invoice,
        items: invoiceItems,
        client,
        company: {
          name: invoiceUser.company || invoiceUser.name,
          email: invoiceUser.email,
          address: invoiceUser.address || '',
          phone: invoiceUser.phone || ''
        }
      });
      
      // Send email
      await sendInvoiceEmail(invoice, client, pdfBuffer);
      
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
  app.get("/api/reminders", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      // Instead of accepting any userId, we use the authenticated user's ID
      // This prevents unauthorized access to another user's reminders
      const userId = user.id;
      
      const reminders = await storage.getRemindersByUserId(userId);
      res.status(200).json(reminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      // Enforce that the userId in the reminder matches the authenticated user
      const reminderData = insertReminderSchema.parse({
        ...req.body,
        userId: user.id // Ensure the reminder belongs to the authenticated user
      });
      
      // If the reminder is associated with an invoice, verify invoice ownership
      if (reminderData.invoiceId) {
        const invoice = await storage.getInvoice(reminderData.invoiceId);
        if (!invoice) {
          return res.status(400).json({ message: "Invoice not found" });
        }
        
        if (invoice.userId !== user.id) {
          return res.status(403).json({ 
            message: "Access denied: You can only create reminders for your own invoices"
          });
        }
      }
      
      const reminder = await storage.createReminder(reminderData);
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Error creating reminder:", error);
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.put("/api/reminders/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const user = (req as any).user;
      
      // Get existing reminder to check ownership
      const existingReminder = await storage.getReminder(id);
      if (!existingReminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      // Security check: Only allow users to update their own reminders
      if (existingReminder.userId !== user.id) {
        return res.status(403).json({ 
          message: "Access denied: You do not have permission to update this reminder"
        });
      }
      
      // Prevent changing userId 
      const reminderUpdates = { ...req.body };
      delete reminderUpdates.userId;
      
      // If invoice ID is being updated, verify it belongs to the user
      if (reminderUpdates.invoiceId && reminderUpdates.invoiceId !== existingReminder.invoiceId) {
        const invoice = await storage.getInvoice(reminderUpdates.invoiceId);
        if (!invoice) {
          return res.status(400).json({ message: "Invoice not found" });
        }
        
        if (invoice.userId !== user.id) {
          return res.status(403).json({ 
            message: "Access denied: You can only link reminders to your own invoices"
          });
        }
      }
      
      const updatedReminder = await storage.updateReminder(id, reminderUpdates);
      res.status(200).json(updatedReminder);
    } catch (error) {
      console.error("Error updating reminder:", error);
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

  // Payment routes
  app.use('/api/payments', paymentRouter);

  // File upload routes
  app.post("/api/upload", authenticateUser, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const attachment = await saveFileMetadata(
        user.id,
        file.originalname,
        file.mimetype,
        file.size,
        file.path
      );
      
      res.status(201).json(attachment);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get("/api/files/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const user = (req as any).user;
      
      const file = await getFileMetadata(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Security check: Only allow users to access their own files
      if (file.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.status(200).json(file);
    } catch (error) {
      console.error("Error getting file:", error);
      res.status(500).json({ message: "Failed to get file" });
    }
  });

  app.delete("/api/files/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const user = (req as any).user;
      
      const file = await getFileMetadata(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Security check: Only allow users to delete their own files
      if (file.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await deleteFile(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Company settings routes
  app.get("/api/company-settings", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      const [settings] = await db.select().from(companySettings).where(eq(companySettings.userId, user.id));
      
      if (!settings) {
        return res.status(404).json({ message: "Company settings not found" });
      }
      
      res.status(200).json(settings);
    } catch (error) {
      console.error("Error getting company settings:", error);
      res.status(500).json({ message: "Failed to get company settings" });
    }
  });

  app.put("/api/company-settings", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const updates = req.body;
      
      // Prevent changing userId
      delete updates.userId;
      
      const [settings] = await db.select().from(companySettings).where(eq(companySettings.userId, user.id));
      
      if (!settings) {
        // Create new settings if they don't exist
        const [newSettings] = await db.insert(companySettings).values({
          userId: user.id,
          ...updates
        }).returning();
        
        res.status(201).json(newSettings);
      } else {
        // Update existing settings
        const [updatedSettings] = await db.update(companySettings)
          .set(updates)
          .where(eq(companySettings.userId, user.id))
          .returning();
        
        res.status(200).json(updatedSettings);
      }
    } catch (error) {
      console.error("Error updating company settings:", error);
      res.status(500).json({ message: "Failed to update company settings" });
    }
  });

  // Team management routes
  app.post("/api/team/invite", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { email, role } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const member = await inviteTeamMember(user.id, email, role);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error inviting team member:", error);
      res.status(500).json({ message: "Failed to invite team member" });
    }
  });

  app.post("/api/team/accept/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      const member = await acceptTeamInvite(token);
      res.status(200).json(member);
    } catch (error) {
      console.error("Error accepting invite:", error);
      res.status(500).json({ message: "Failed to accept invite" });
    }
  });

  app.get("/api/team/members", authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const members = await db.select().from(teamMembers).where(eq(teamMembers.userId, user.id));
      res.status(200).json(members);
    } catch (error) {
      console.error("Error getting team members:", error);
      res.status(500).json({ message: "Failed to get team members" });
    }
  });

  app.put("/api/team/members/:id/role", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const user = (req as any).user;
      const { role } = req.body;
      
      // Only admins can change roles
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can change roles" });
      }
      
      const member = await updateTeamMemberRole(id, role);
      res.status(200).json(member);
    } catch (error) {
      console.error("Error updating team member role:", error);
      res.status(500).json({ message: "Failed to update team member role" });
    }
  });

  app.delete("/api/team/members/:id", authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = getIdParam(req);
      const user = (req as any).user;
      
      // Only admins can remove team members
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can remove team members" });
      }
      
      await removeTeamMember(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ message: "Failed to remove team member" });
    }
  });

  // Attach auditLog middleware to all mutating routes
  app.use(auditLog);

  // --- Attachments Linking ---
  app.post('/api/attachments/link', authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { attachmentId, invoiceId, clientId, reminderId } = req.body;
      if (!attachmentId) return res.status(400).json({ message: 'attachmentId required' });
      // Update attachment with entity linkage
      const updates: any = {};
      if (invoiceId) updates.invoiceId = invoiceId;
      if (clientId) updates.clientId = clientId;
      if (reminderId) updates.reminderId = reminderId;
      const [updated] = await db.update(attachments).set(updates).where(eq(attachments.id, attachmentId)).returning();
      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ message: 'Failed to link attachment' });
    }
  });

  app.get('/api/attachments/by-entity', authenticateUser, async (req: Request, res: Response) => {
    try {
      const { type, id } = req.query;
      if (!type || !id) return res.status(400).json({ message: 'type and id required' });
      let whereClause;
      if (type === 'invoice') whereClause = eq(attachments.invoiceId, Number(id));
      else if (type === 'client') whereClause = eq(attachments.clientId, Number(id));
      else if (type === 'reminder') whereClause = eq(attachments.reminderId, Number(id));
      else return res.status(400).json({ message: 'Invalid type' });
      const files = await db.select().from(attachments).where(whereClause);
      res.status(200).json(files);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch attachments' });
    }
  });

  // --- Invoice Templates ---
  app.post('/api/invoice-template', authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { name, templatePath } = req.body;
      if (!name || !templatePath) return res.status(400).json({ message: 'name and templatePath required' });
      const [template] = await db.insert(invoiceTemplates).values({
        userId: user.id,
        name,
        templatePath,
        createdAt: new Date(),
      }).returning();
      res.status(201).json(template);
    } catch (error) {
      res.status(500).json({ message: 'Failed to save template' });
    }
  });

  app.get('/api/invoice-template', authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const templates = await db.select().from(invoiceTemplates).where(eq(invoiceTemplates.userId, user.id));
      res.status(200).json(templates);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  // --- Audit Logs (role-based access) ---
  app.get('/api/audit-logs', authenticateUser, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      let logs;
      if (user.role === 'super_admin') {
        logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp));
      } else if (user.role === 'admin') {
        logs = await db.select().from(auditLogs).where(eq(auditLogs.userId, user.id)).orderBy(desc(auditLogs.timestamp));
      } else {
        logs = await db.select().from(auditLogs).where(eq(auditLogs.userId, user.id)).orderBy(desc(auditLogs.timestamp));
      }
      res.status(200).json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

export default router;
