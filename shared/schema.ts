import { z } from "zod";
import { pgTable, text, uuid, integer, boolean, timestamp, doublePrecision, pgEnum, serial, varchar, date, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// User roles enum
export const roleEnum = pgEnum('role', ['super_admin', 'admin', 'user']);
// User status enum
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended']);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password"),
  name: varchar("name", { length: 100 }).notNull(),
  role: roleEnum("role").notNull().default('user'),
  status: userStatusEnum("status").notNull().default('active'),
  company: varchar("company", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Clients table
export const clients = pgTable("clients", {
  id: integer("id").primaryKey().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  company: varchar("company", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: uuid("user_id").references(() => users.id),
});

// Items table
export const items = pgTable("items", {
  id: integer("id").primaryKey().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 50 }),
  isInventory: boolean("is_inventory").default(false),
  stockQuantity: integer("stock_quantity").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  userId: uuid("user_id").references(() => users.id),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: integer("client_id").references(() => clients.id),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default('draft'),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default(sql`0`),
  tax: numeric("tax", { precision: 10, scale: 2 }).default(sql`0`),
  discount: numeric("discount", { precision: 10, scale: 2 }).default(sql`0`),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default(sql`0`),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: uuid("user_id").references(() => users.id).default(sql`auth.uid()`),
});

// Invoice Items table
export const invoiceItems = pgTable("invoice_items", {
  id: integer("id").primaryKey().notNull(),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  itemId: integer("item_id").references(() => items.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  userId: uuid("user_id").references(() => users.id),
});

// Company Settings table
export const companySettings = pgTable("company_settings", {
  id: integer("id").primaryKey().notNull(),
  logoPath: text("logo_path"),
  companyName: text("company_name"),
  taxNumber: text("tax_number"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userId: uuid("user_id").references(() => users.id),
});

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: integer("id").primaryKey().notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  timestamp: timestamp("timestamp").defaultNow(),
  userId: uuid("user_id").references(() => users.id),
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  status: text("status").notNull(),
  priceId: text("price_id").notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  userId: uuid("user_id").references(() => users.id),
});

// Payment Methods table
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  stripePaymentMethodId: text("stripe_payment_method_id").notNull(),
  type: text("type").notNull(),
  brand: text("brand"),
  last4: text("last4"),
  expMonth: integer("exp_month"),
  expYear: integer("exp_year"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: uuid("user_id").references(() => users.id),
});

// Team Members table
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitedBy: uuid("invited_by").references(() => users.id).notNull(),
  email: text("email").notNull(),
  role: roleEnum("role").notNull().default('user'),
  status: text("status").notNull().default('pending'),
  inviteToken: text("invite_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userId: uuid("user_id").references(() => users.id),
});

// User Settings table
export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id").primaryKey().references(() => users.id),
  theme: text("theme").notNull().default('light'),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  fontSize: text("fontsize").notNull().default('medium'),
  currency: text("currency").notNull().default('USD'),
  dateFormat: text("dateformat").notNull().default('MM/DD/YYYY'),
  twoFactorAuth: boolean("twofactorauth").notNull().default(false),
  sessionTimeout: text("sessiontimeout").notNull().default('30'),
  loginNotifications: boolean("loginnotifications").notNull().default(true),
  emailNotifications: boolean("emailnotifications").notNull().default(true),
  invoiceReminders: boolean("invoicereminders").notNull().default(true),
  paymentNotifications: boolean("paymentnotifications").notNull().default(true),
  marketingEmails: boolean("marketingemails").notNull().default(false),
  reminderFrequency: text("reminderfrequency").notNull().default('weekly'),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  items: many(items),
  invoices: many(invoices),
  invoiceItems: many(invoiceItems),
  companySettings: many(companySettings),
  auditLogs: many(auditLogs),
  subscriptions: many(subscriptions),
  paymentMethods: many(paymentMethods),
  teamMembers: many(teamMembers),
  userSettings: many(userSettings),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  invoices: many(invoices),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  user: one(users, {
    fields: [items.userId],
    references: [users.id],
  }),
  invoiceItems: many(invoiceItems),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  item: one(items, {
    fields: [invoiceItems.itemId],
    references: [items.id],
  }),
  user: one(users, {
    fields: [invoiceItems.userId],
    references: [users.id],
  }),
}));

// Type definitions for your database tables
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password: string | null;
          name: string;
          role: 'super_admin' | 'admin' | 'user';
          status: 'active' | 'inactive' | 'suspended';
          company: string | null;
          phone: string | null;
          address: string | null;
          created_at: Date;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      clients: {
        Row: {
          id: number;
          name: string;
          email: string;
          company: string | null;
          phone: string | null;
          address: string | null;
          notes: string | null;
          created_at: Date;
          user_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      items: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          price: number;
          category: string | null;
          is_inventory: boolean;
          stock_quantity: number;
          created_at: Date;
          user_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['items']['Insert']>;
      };
      invoices: {
        Row: {
          id: string;
          client_id: number | null;
          invoice_number: string;
          status: string;
          issue_date: Date;
          due_date: Date;
          subtotal: number;
          tax: number;
          discount: number;
          total: number;
          notes: string | null;
          created_at: Date;
          user_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
      invoice_items: {
        Row: {
          id: number;
          invoice_id: number | null;
          item_id: number | null;
          description: string;
          quantity: number;
          price: number;
          total: number;
          user_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['invoice_items']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['invoice_items']['Insert']>;
      };
      company_settings: {
        Row: {
          id: number;
          logo_path: string | null;
          company_name: string | null;
          tax_number: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          created_at: Date;
          updated_at: Date;
          user_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['company_settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['company_settings']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: number;
          action: string;
          entity: string;
          entity_id: number | null;
          timestamp: Date | null;
          user_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'timestamp'>;
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: number;
          stripe_subscription_id: string;
          status: string;
          price_id: string;
          current_period_start: Date | null;
          current_period_end: Date | null;
          cancel_at_period_end: boolean | null;
          created_at: Date;
          user_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
      payment_methods: {
        Row: {
          id: number;
          stripe_payment_method_id: string;
          type: string;
          brand: string | null;
          last4: string | null;
          exp_month: number | null;
          exp_year: number | null;
          created_at: Date;
          user_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['payment_methods']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['payment_methods']['Insert']>;
      };
      team_members: {
        Row: {
          id: string;
          invited_by: string;
          email: string;
          role: 'super_admin' | 'admin' | 'user';
          status: string;
          invite_token: string | null;
          created_at: Date;
          updated_at: Date;
          user_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['team_members']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['team_members']['Insert']>;
      };
      user_settings: {
        Row: {
          user_id: string;
          theme: string;
          updated_at: Date | null;
          fontsize: string;
          currency: string;
          dateformat: string;
          twofactorauth: boolean;
          sessiontimeout: string;
          loginnotifications: boolean;
          emailnotifications: boolean;
          invoicereminders: boolean;
          paymentnotifications: boolean;
          marketingemails: boolean;
          reminderfrequency: string;
        };
        Insert: Omit<Database['public']['Tables']['user_settings']['Row'], 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_settings']['Insert']>;
      };
    };
  };
};

// Zod schemas for validation
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  company: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['super_admin', 'admin', 'user']),
  status: z.enum(['active', 'inactive', 'suspended']),
  company: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
});

export const insertClientSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  company: z.string().max(100).nullable(),
  phone: z.string().max(20).nullable(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
  user_id: z.string().uuid().nullable(),
});

export const insertItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  price: z.number().min(0).default(0),
  category: z.string().max(50).nullable(),
  isInventory: z.boolean().default(false),
  stockQuantity: z.number().min(0).default(0),
  userId: z.string().uuid().nullable(),
});

export const insertInvoiceSchema = z.object({
  user_id: z.string().uuid().nullable(),
  client_id: z.number().nullable(),
  invoice_number: z.string().max(50),
  status: z.string().max(50).default('draft'),
  issue_date: z.date(),
  due_date: z.date(),
  subtotal: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  notes: z.string().nullable(),
  is_recurring: z.boolean().default(false),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'annually']).optional(),
  next_invoice_date: z.date().optional(),
});

export const insertInvoiceItemSchema = z.object({
  invoice_id: z.number().nullable(),
  item_id: z.number().nullable(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  price: z.number().positive(),
  total: z.number().positive(),
  user_id: z.string().uuid().nullable(),
});

export const companySettingsSchema = z.object({
  logo_path: z.string().nullable(),
  company_name: z.string().nullable(),
  tax_number: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  user_id: z.string().uuid().nullable(),
});

export const subscriptionSchema = z.object({
  stripe_subscription_id: z.string(),
  status: z.string(),
  price_id: z.string(),
  current_period_start: z.date().nullable(),
  current_period_end: z.date().nullable(),
  cancel_at_period_end: z.boolean().nullable(),
  user_id: z.string().uuid().nullable(),
});

export const paymentMethodSchema = z.object({
  stripe_payment_method_id: z.string(),
  type: z.string(),
  brand: z.string().nullable(),
  last4: z.string().nullable(),
  exp_month: z.number().nullable(),
  exp_year: z.number().nullable(),
  user_id: z.string().uuid().nullable(),
});

export const teamMemberSchema = z.object({
  invited_by: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['super_admin', 'admin', 'user']).default('user'),
  status: z.string().default('pending'),
  invite_token: z.string().nullable(),
  user_id: z.string().uuid().nullable(),
});

export const userSettingsSchema = z.object({
  theme: z.string().default('light'),
  fontsize: z.string().default('medium'),
  currency: z.string().default('USD'),
  dateformat: z.string().default('MM/DD/YYYY'),
  twofactorauth: z.boolean().default(false),
  sessiontimeout: z.string().default('30'),
  loginnotifications: z.boolean().default(true),
  emailnotifications: z.boolean().default(true),
  invoicereminders: z.boolean().default(true),
  paymentnotifications: z.boolean().default(true),
  marketingemails: z.boolean().default(false),
  reminderfrequency: z.string().default('weekly'),
});

// Export types
export type User = Database['public']['Tables']['users']['Row'];
export type NewUser = Database['public']['Tables']['users']['Insert'];
export type UpdateUser = Database['public']['Tables']['users']['Update'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type NewClient = Database['public']['Tables']['clients']['Insert'];
export type UpdateClient = Database['public']['Tables']['clients']['Update'];
export type Item = Database['public']['Tables']['items']['Row'];
export type NewItem = Database['public']['Tables']['items']['Insert'];
export type UpdateItem = Database['public']['Tables']['items']['Update'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type NewInvoice = Database['public']['Tables']['invoices']['Insert'];
export type UpdateInvoice = Database['public']['Tables']['invoices']['Update'];
export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
export type NewInvoiceItem = Database['public']['Tables']['invoice_items']['Insert'];
export type UpdateInvoiceItem = Database['public']['Tables']['invoice_items']['Update'];
export type CompanySettings = Database['public']['Tables']['company_settings']['Row'];
export type NewCompanySettings = Database['public']['Tables']['company_settings']['Insert'];
export type UpdateCompanySettings = Database['public']['Tables']['company_settings']['Update'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type NewAuditLog = Database['public']['Tables']['audit_logs']['Insert'];
export type UpdateAuditLog = Database['public']['Tables']['audit_logs']['Update'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type NewSubscription = Database['public']['Tables']['subscriptions']['Insert'];
export type UpdateSubscription = Database['public']['Tables']['subscriptions']['Update'];
export type PaymentMethod = Database['public']['Tables']['payment_methods']['Row'];
export type NewPaymentMethod = Database['public']['Tables']['payment_methods']['Insert'];
export type UpdatePaymentMethod = Database['public']['Tables']['payment_methods']['Update'];
export type TeamMember = Database['public']['Tables']['team_members']['Row'];
export type NewTeamMember = Database['public']['Tables']['team_members']['Insert'];
export type UpdateTeamMember = Database['public']['Tables']['team_members']['Update'];
export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type NewUserSettings = Database['public']['Tables']['user_settings']['Insert'];
export type UpdateUserSettings = Database['public']['Tables']['user_settings']['Update'];
