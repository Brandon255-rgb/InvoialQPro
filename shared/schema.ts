import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const roleEnum = pgEnum('role', ['admin', 'employee', 'user']);

// User status enum
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended']);

// Invoice status enum
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']);

// Invoice frequency enum for recurring invoices
export const invoiceFrequencyEnum = pgEnum('invoice_frequency', ['weekly', 'biweekly', 'monthly', 'quarterly', 'annually']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default('user'),
  status: userStatusEnum("status").notNull().default('active'),
  company: text("company"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Items (products/services) table
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  category: text("category"),
  isInventory: boolean("is_inventory").default(false),
  stockQuantity: integer("stock_quantity"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  invoiceNumber: text("invoice_number").notNull(),
  status: invoiceStatusEnum("status").notNull().default('draft'),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
  tax: doublePrecision("tax").default(0),
  discount: doublePrecision("discount").default(0),
  total: doublePrecision("total").notNull(),
  notes: text("notes"),
  isRecurring: boolean("is_recurring").default(false),
  frequency: invoiceFrequencyEnum("frequency"),
  nextInvoiceDate: timestamp("next_invoice_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoice items (line items) table
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  itemId: integer("item_id").references(() => items.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
  total: doublePrecision("total").notNull(),
});

// Reminders table
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define Zod schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
}).omit({ id: true, createdAt: true });

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });

export const insertItemSchema = createInsertSchema(items).omit({ id: true, createdAt: true });

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });

export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
