import { z } from "zod";
import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Type definitions for your database tables
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'super_admin' | 'admin' | 'user';
          status: 'active' | 'inactive';
          company: string | null;
          phone: string | null;
          address: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string | null;
          company: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          price: number;
          category: string | null;
          is_inventory: boolean;
          stock_quantity: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['items']['Insert']>;
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          invoice_number: string;
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
          issue_date: string;
          due_date: string;
          subtotal: number;
          tax_rate: number;
          tax_amount: number;
          total: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          item_id: string | null;
          description: string;
          quantity: number;
          price: number;
          total: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['invoice_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['invoice_items']['Insert']>;
      };
      company_settings: {
        Row: {
          id: string;
          user_id: string;
          logo_path: string | null;
          company_name: string | null;
          tax_number: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['company_settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['company_settings']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          timestamp: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'timestamp'>;
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
    };
  };
};

// Zod schemas for validation
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  company: z.string().min(1, "Company name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['super_admin', 'admin', 'user']),
  status: z.enum(['active', 'inactive']),
  company: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
});

export const clientSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
});

export const itemSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  price: z.number().positive(),
  category: z.string().nullable(),
  is_inventory: z.boolean(),
  stock_quantity: z.number().nullable(),
});

export const invoiceSchema = z.object({
  user_id: z.string().uuid(),
  client_id: z.string().uuid(),
  invoice_number: z.string(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  issue_date: z.string(),
  due_date: z.string(),
  subtotal: z.number().positive(),
  tax_rate: z.number().min(0),
  tax_amount: z.number().min(0),
  total: z.number().positive(),
  notes: z.string().nullable(),
});

export const invoiceItemSchema = z.object({
  invoice_id: z.string().uuid(),
  item_id: z.string().uuid().nullable(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  price: z.number().positive(),
  total: z.number().positive(),
});

export const companySettingsSchema = z.object({
  user_id: z.string().uuid(),
  logo_path: z.string().nullable(),
  company_name: z.string().nullable(),
  tax_number: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
});

// Define your Drizzle table (for backend use) (for example, clients)
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  company: text("company").notNull(),
  address: text("address").notNull(),
  notes: text("notes").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// (Optional) Define a Zod schema (for frontend use) (for example, clientSchema) –– remove or comment out this block if it is duplicated
// export const clientSchema = z.object({
//   id: z.number().optional(),
//   name: z.string().min(1, "Name is required"),
//   email: z.string().email("Invalid email address"),
//   phone: z.string().optional(),
//   company: z.string().optional(),
//   address: z.string().optional(),
//   notes: z.string().optional(),
// });

// (Keep the export for insertClientSchema (using drizzle-zod) so that the frontend (ClientForm.tsx) can import it.)
export const insertClientSchema = createInsertSchema(clients);

/* (Insert a new Drizzle table definition for invoices (for backend use) so that drizzle-zod can generate insertInvoiceSchema.) */
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  client_id: text("client_id").notNull(),
  invoice_number: text("invoice_number").notNull(),
  status: text("status").notNull(),
  issue_date: text("issue_date").notNull(),
  due_date: text("due_date").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
  tax_rate: doublePrecision("tax_rate").notNull(),
  tax_amount: doublePrecision("tax_amount").notNull(),
  total: doublePrecision("total").notNull(),
  notes: text("notes").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

/* (Insert a new export for insertInvoiceSchema (using drizzle-zod) so that InvoiceForm.tsx can import it.) */
export const insertInvoiceSchema = createInsertSchema(invoices);

/* (Insert a new Drizzle table definition for items (for backend use) so that drizzle-zod can generate insertItemSchema.) */
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  category: text("category").notNull(),
  is_inventory: boolean("is_inventory").notNull(),
  stock_quantity: integer("stock_quantity").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

/* (Insert a new export for insertItemSchema (using drizzle-zod) so that ItemForm.tsx can import it.) */
export const insertItemSchema = createInsertSchema(items);
