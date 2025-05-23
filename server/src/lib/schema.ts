import { pgTable, uuid, text, timestamp, integer, numeric, boolean, jsonb, varchar, date, primaryKey, pgEnum, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('user_role', ['super_admin', 'admin', 'user']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password'),
  name: text('name'),
  role: roleEnum('role').default('user'),
  status: userStatusEnum('status').default('active'),
  company: text('company'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  postal_code: text('postal_code'),
  website: text('website'),
  profile_picture: text('profile_picture'),
  bio: text('bio'),
  job_title: varchar('job_title', { length: 100 }),
  department: varchar('department', { length: 100 }),
  timezone: varchar('timezone', { length: 100 }),
  language: varchar('language', { length: 50 }),
  date_of_birth: date('date_of_birth'),
  gender: varchar('gender', { length: 20 }),
  linkedin: text('linkedin'),
  twitter: text('twitter'),
  facebook: text('facebook'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Clients table
export const clients = pgTable('clients', {
  id: integer('id').primaryKey().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  company: varchar('company', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
  user_id: uuid('user_id').references(() => users.id),
});

// Items table
export const items = pgTable('items', {
  id: integer('id').primaryKey().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  category: varchar('category', { length: 50 }),
  is_inventory: boolean('is_inventory').default(false),
  stock_quantity: integer('stock_quantity').default(0),
  created_at: timestamp('created_at').defaultNow(),
  user_id: uuid('user_id').references(() => users.id),
});

// Invoices table
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  client_id: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  invoice_number: varchar('invoice_number', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).default('draft'),
  issue_date: date('issue_date').notNull(),
  due_date: date('due_date').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: numeric('tax', { precision: 10, scale: 2 }).default('0'),
  discount: numeric('discount', { precision: 10, scale: 2 }).default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
});

// Invoice Items table
export const invoiceItems = pgTable('invoice_items', {
  id: integer('id').primaryKey().notNull(),
  invoice_id: integer('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }),
  item_id: integer('item_id').references(() => items.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  user_id: uuid('user_id').references(() => users.id),
});

// Company Settings table
export const companySettings = pgTable('company_settings', {
  id: integer('id').primaryKey().notNull(),
  logo_path: text('logo_path'),
  company_name: text('company_name'),
  tax_number: text('tax_number'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  user_id: uuid('user_id').references(() => users.id),
});

// Reminders table
export const reminders = pgTable('reminders', {
  id: integer('id').primaryKey().notNull(),
  invoice_id: integer('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description'),
  due_date: date('due_date').notNull(),
  is_completed: boolean('is_completed').default(false),
  created_at: timestamp('created_at').defaultNow(),
  user_id: uuid('user_id').references(() => users.id),
});

// Attachments table
export const attachments = pgTable('attachments', {
  id: integer('id').primaryKey().notNull(),
  file_name: text('file_name').notNull(),
  file_type: text('file_type').notNull(),
  file_size: integer('file_size').notNull(),
  file_path: text('file_path').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  reminder_id: integer('reminder_id').references(() => reminders.id, { onDelete: 'set null' }),
  user_id: uuid('user_id').references(() => users.id),
});

// Team Members table
export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  invited_by: uuid('invited_by').notNull().references(() => users.id),
  email: text('email').notNull(),
  role: text('role').notNull().default('user'),
  status: text('status').notNull().default('pending'),
  invite_token: text('invite_token'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  user_id: uuid('user_id').references(() => users.id),
});

// User Settings table
export const userSettings = pgTable('user_settings', {
  user_id: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  theme: text('theme').notNull().default('light'),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  fontsize: text('fontsize').notNull().default('medium'),
  currency: text('currency').notNull().default('USD'),
  dateformat: text('dateformat').notNull().default('MM/DD/YYYY'),
  twofactorauth: boolean('twofactorauth').notNull().default(false),
  sessiontimeout: text('sessiontimeout').notNull().default('30'),
  loginnotifications: boolean('loginnotifications').notNull().default(true),
  emailnotifications: boolean('emailnotifications').notNull().default(true),
  invoicereminders: boolean('invoicereminders').notNull().default(true),
  paymentnotifications: boolean('paymentnotifications').notNull().default(true),
  marketingemails: boolean('marketingemails').notNull().default(false),
  reminderfrequency: text('reminderfrequency').notNull().default('weekly'),
});

// Tags table
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  user_id: uuid('user_id').references(() => users.id),
});

// Invoice Tags junction table
export const invoiceTags = pgTable('invoice_tags', {
  invoice_id: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }),
  tag_id: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.invoice_id, table.tag_id] }),
}));

// Activity Feed table
export const activityFeed = pgTable('activity_feed', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id),
  event_type: text('event_type').notNull(),
  payload: jsonb('payload'),
  created_at: timestamp('created_at').defaultNow(),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull(),
  status: text('status').notNull(),
  priceId: text('price_id').notNull(),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  userId: uuid('user_id').references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  invoices: many(invoices),
  items: many(items),
  companySettings: many(companySettings),
  reminders: many(reminders),
  attachments: many(attachments),
  teamMembers: many(teamMembers),
  userSettings: many(userSettings),
  tags: many(tags),
  activityFeed: many(activityFeed),
  subscriptions: many(subscriptions),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.client_id],
    references: [clients.id],
  }),
  items: many(invoiceItems),
  reminders: many(reminders),
  tags: many(invoiceTags),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.user_id],
    references: [users.id],
  }),
  invoices: many(invoices),
})); 