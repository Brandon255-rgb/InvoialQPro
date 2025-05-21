import { db } from './db';
import {
  users, User, InsertUser,
  clients, Client, InsertClient,
  items, Item, InsertItem,
  invoices, Invoice, InsertInvoice,
  invoiceItems, InvoiceItem, InsertInvoiceItem,
  reminders, Reminder, InsertReminder,
  attachments, Attachment, InsertAttachment,
  companySettings, CompanySettings, InsertCompanySettings,
  teamMembers, TeamMember, InsertTeamMember,
  auditLogs, AuditLog, InsertAuditLog
} from '@shared/schema';

// ... rest of the storage.ts file content ... 