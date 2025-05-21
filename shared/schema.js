import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
// User roles enum
export const roleEnum = pgEnum('role', ['super_admin', 'admin', 'user']);
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
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
// File attachments table
export const attachments = pgTable('attachments', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    fileName: text('file_name').notNull(),
    fileType: text('file_type').notNull(),
    fileSize: integer('file_size').notNull(),
    filePath: text('file_path').notNull(),
    invoiceId: integer('invoice_id').references(() => invoices.id),
    clientId: integer('client_id').references(() => clients.id),
    reminderId: integer('reminder_id').references(() => reminders.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Company settings table
export const companySettings = pgTable('company_settings', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    logoPath: text('logo_path'),
    companyName: text('company_name'),
    taxNumber: text('tax_number'),
    address: text('address'),
    phone: text('phone'),
    email: text('email'),
    website: text('website'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Team members table
export const teamMembers = pgTable('team_members', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    invitedBy: integer('invited_by').references(() => users.id).notNull(),
    email: text('email').notNull(),
    role: roleEnum('role').default('user').notNull(),
    status: text('status').default('pending').notNull(), // pending, active, rejected
    inviteToken: text('invite_token'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Audit logs table
export const auditLogs = pgTable('audit_logs', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: integer('entity_id'),
    timestamp: timestamp('timestamp').defaultNow(),
});
// Invoice templates table
export const invoiceTemplates = pgTable('invoice_templates', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    templatePath: text('template_path').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
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
