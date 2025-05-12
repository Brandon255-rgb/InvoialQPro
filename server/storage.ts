import {
  users, User, InsertUser,
  clients, Client, InsertClient,
  items, Item, InsertItem,
  invoices, Invoice, InsertInvoice,
  invoiceItems, InvoiceItem, InsertInvoiceItem,
  reminders, Reminder, InsertReminder
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientsByUserId(userId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Item operations
  getItem(id: number): Promise<Item | undefined>;
  getItemsByUserId(userId: number): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, item: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
  
  // Invoice operations
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByUserId(userId: number): Promise<Invoice[]>;
  getInvoicesByClientId(clientId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Invoice items operations
  getInvoiceItem(id: number): Promise<InvoiceItem | undefined>;
  getInvoiceItemsByInvoiceId(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoiceItem(invoiceItem: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, invoiceItem: Partial<InvoiceItem>): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: number): Promise<boolean>;
  
  // Reminder operations
  getReminder(id: number): Promise<Reminder | undefined>;
  getRemindersByUserId(userId: number): Promise<Reminder[]>;
  getRemindersByInvoiceId(invoiceId: number): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, reminder: Partial<Reminder>): Promise<Reminder | undefined>;
  deleteReminder(id: number): Promise<boolean>;

  // Analytics operations
  getTotalRevenue(userId: number): Promise<number>;
  getOutstandingAmount(userId: number): Promise<number>;
  getActiveClientsCount(userId: number): Promise<number>;
  getItemsInStockCount(userId: number): Promise<number>;
  getRevenueByMonth(userId: number, year: number): Promise<{month: number, revenue: number}[]>;
  getInvoiceStatusSummary(userId: number): Promise<{status: string, count: number}[]>;
  getTopClients(userId: number, limit: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private items: Map<number, Item>;
  private invoices: Map<number, Invoice>;
  private invoiceItems: Map<number, InvoiceItem>;
  private reminders: Map<number, Reminder>;
  
  private userIdCounter: number;
  private clientIdCounter: number;
  private itemIdCounter: number;
  private invoiceIdCounter: number;
  private invoiceItemIdCounter: number;
  private reminderIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.items = new Map();
    this.invoices = new Map();
    this.invoiceItems = new Map();
    this.reminders = new Map();
    
    this.userIdCounter = 1;
    this.clientIdCounter = 1;
    this.itemIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.invoiceItemIdCounter = 1;
    this.reminderIdCounter = 1;

    // Add a default admin user
    this.createUser({
      email: 'admin@invoaiq.com',
      password: 'password123',
      name: 'Administrator',
      role: 'admin',
      status: 'active',
      company: 'InvoaIQ Inc.'
    });

    // Add some sample data for the admin user
    this.setupSampleData(1);
  }

  private setupSampleData(userId: number) {
    // Create some clients
    const client1 = this.createClient({
      userId,
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+1 (555) 123-4567',
      company: 'Acme Corp',
      address: '123 Main St, San Francisco, CA',
      notes: 'Software Development client'
    });

    const client2 = this.createClient({
      userId,
      name: 'Global Solutions',
      email: 'info@globalsolutions.com',
      phone: '+1 (555) 987-6543',
      company: 'Global Solutions Ltd',
      address: '456 Market St, New York, NY',
      notes: 'Consulting Services client'
    });

    const client3 = this.createClient({
      userId,
      name: 'TechCorp Inc.',
      email: 'support@techcorp.com',
      phone: '+1 (555) 789-0123',
      company: 'TechCorp Incorporated',
      address: '789 Tech Blvd, Austin, TX',
      notes: 'Web Development client'
    });

    // Create some items
    this.createItem({
      userId,
      name: 'Web Design',
      description: 'Professional web design services',
      price: 1500,
      category: 'Services',
      isInventory: false
    });

    this.createItem({
      userId,
      name: 'App Development',
      description: 'Mobile application development',
      price: 3000,
      category: 'Services',
      isInventory: false
    });

    this.createItem({
      userId,
      name: 'SEO Package',
      description: 'Search engine optimization services',
      price: 800,
      category: 'Services',
      isInventory: false
    });

    this.createItem({
      userId,
      name: 'Server Hardware',
      description: 'Dell PowerEdge R740 Server',
      price: 2500,
      category: 'Hardware',
      isInventory: true,
      stockQuantity: 5
    });

    // Create some invoices
    const invoice1 = this.createInvoice({
      userId,
      clientId: client1.id,
      invoiceNumber: 'INV-2024',
      status: 'paid',
      issueDate: new Date('2023-07-01'),
      dueDate: new Date('2023-07-15'),
      subtotal: 2500,
      tax: 0,
      discount: 0,
      total: 2500,
      notes: 'Thank you for your business'
    });

    const invoice2 = this.createInvoice({
      userId,
      clientId: client2.id,
      invoiceNumber: 'INV-2023',
      status: 'pending',
      issueDate: new Date('2023-07-10'),
      dueDate: new Date('2023-07-24'),
      subtotal: 1800,
      tax: 0,
      discount: 0,
      total: 1800,
      notes: 'Net 14 payment terms'
    });

    const invoice3 = this.createInvoice({
      userId,
      clientId: client3.id,
      invoiceNumber: 'INV-2022',
      status: 'overdue',
      issueDate: new Date('2023-06-15'),
      dueDate: new Date('2023-06-29'),
      subtotal: 3200,
      tax: 0,
      discount: 0,
      total: 3200,
      notes: 'Please pay upon receipt'
    });

    // Add invoice items
    this.createInvoiceItem({
      invoiceId: invoice1.id,
      itemId: 1,
      description: 'Web Design Services',
      quantity: 1,
      price: 1500,
      total: 1500
    });

    this.createInvoiceItem({
      invoiceId: invoice1.id,
      itemId: 3,
      description: 'SEO Package',
      quantity: 1,
      price: 800,
      total: 800
    });

    this.createInvoiceItem({
      invoiceId: invoice1.id,
      itemId: 4,
      description: 'Server Hardware',
      quantity: 1,
      price: 200,
      total: 200
    });

    this.createInvoiceItem({
      invoiceId: invoice2.id,
      itemId: 3,
      description: 'SEO Package',
      quantity: 1,
      price: 800,
      total: 800
    });

    this.createInvoiceItem({
      invoiceId: invoice2.id,
      itemId: 1,
      description: 'Web Design',
      quantity: 1,
      price: 1000,
      total: 1000
    });

    this.createInvoiceItem({
      invoiceId: invoice3.id,
      itemId: 2,
      description: 'App Development',
      quantity: 1,
      price: 3000,
      total: 3000
    });

    this.createInvoiceItem({
      invoiceId: invoice3.id,
      itemId: 3,
      description: 'SEO Package',
      quantity: 0.25,
      price: 800,
      total: 200
    });

    // Create reminders
    this.createReminder({
      userId,
      invoiceId: invoice2.id,
      title: 'Invoice #2023 reminder',
      description: 'Send payment reminder to Global Solutions',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      isCompleted: false
    });

    this.createReminder({
      userId,
      invoiceId: invoice3.id,
      title: 'Follow up on overdue invoice',
      description: 'Call TechCorp regarding Invoice #2022',
      dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // Today
      isCompleted: false
    });

    this.createReminder({
      userId,
      title: 'Generate monthly invoices',
      description: 'Create recurring invoices for subscription clients',
      dueDate: new Date('2023-08-01'),
      isCompleted: false
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // bcrypt will be used in the routes layer for password hashing
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientsByUserId(userId: number): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(client => client.userId === userId);
  }

  async createClient(client: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const newClient: Client = { ...client, id, createdAt: new Date() };
    this.clients.set(id, newClient);
    return newClient;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const client = await this.getClient(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...clientData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Item operations
  async getItem(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async getItemsByUserId(userId: number): Promise<Item[]> {
    return Array.from(this.items.values()).filter(item => item.userId === userId);
  }

  async createItem(item: InsertItem): Promise<Item> {
    const id = this.itemIdCounter++;
    const newItem: Item = { ...item, id, createdAt: new Date() };
    this.items.set(id, newItem);
    return newItem;
  }

  async updateItem(id: number, itemData: Partial<Item>): Promise<Item | undefined> {
    const item = await this.getItem(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemData };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async deleteItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }

  // Invoice operations
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoicesByUserId(userId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.userId === userId);
  }

  async getInvoicesByClientId(clientId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.clientId === clientId);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceIdCounter++;
    const newInvoice: Invoice = { ...invoice, id, createdAt: new Date() };
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }

  async updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = { ...invoice, ...invoiceData };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    // Delete related invoice items first
    const invoiceItems = await this.getInvoiceItemsByInvoiceId(id);
    invoiceItems.forEach(item => this.deleteInvoiceItem(item.id));
    
    // Delete related reminders
    const reminders = await this.getRemindersByInvoiceId(id);
    reminders.forEach(reminder => this.deleteReminder(reminder.id));
    
    return this.invoices.delete(id);
  }

  // Invoice items operations
  async getInvoiceItem(id: number): Promise<InvoiceItem | undefined> {
    return this.invoiceItems.get(id);
  }

  async getInvoiceItemsByInvoiceId(invoiceId: number): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values()).filter(item => item.invoiceId === invoiceId);
  }

  async createInvoiceItem(invoiceItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const id = this.invoiceItemIdCounter++;
    const newInvoiceItem: InvoiceItem = { ...invoiceItem, id };
    this.invoiceItems.set(id, newInvoiceItem);
    return newInvoiceItem;
  }

  async updateInvoiceItem(id: number, itemData: Partial<InvoiceItem>): Promise<InvoiceItem | undefined> {
    const invoiceItem = await this.getInvoiceItem(id);
    if (!invoiceItem) return undefined;
    
    const updatedInvoiceItem = { ...invoiceItem, ...itemData };
    this.invoiceItems.set(id, updatedInvoiceItem);
    return updatedInvoiceItem;
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    return this.invoiceItems.delete(id);
  }

  // Reminder operations
  async getReminder(id: number): Promise<Reminder | undefined> {
    return this.reminders.get(id);
  }

  async getRemindersByUserId(userId: number): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(reminder => reminder.userId === userId);
  }

  async getRemindersByInvoiceId(invoiceId: number): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(reminder => reminder.invoiceId === invoiceId);
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const id = this.reminderIdCounter++;
    const newReminder: Reminder = { ...reminder, id, createdAt: new Date() };
    this.reminders.set(id, newReminder);
    return newReminder;
  }

  async updateReminder(id: number, reminderData: Partial<Reminder>): Promise<Reminder | undefined> {
    const reminder = await this.getReminder(id);
    if (!reminder) return undefined;
    
    const updatedReminder = { ...reminder, ...reminderData };
    this.reminders.set(id, updatedReminder);
    return updatedReminder;
  }

  async deleteReminder(id: number): Promise<boolean> {
    return this.reminders.delete(id);
  }

  // Analytics operations
  async getTotalRevenue(userId: number): Promise<number> {
    const userInvoices = await this.getInvoicesByUserId(userId);
    return userInvoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0);
  }

  async getOutstandingAmount(userId: number): Promise<number> {
    const userInvoices = await this.getInvoicesByUserId(userId);
    return userInvoices
      .filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + invoice.total, 0);
  }

  async getActiveClientsCount(userId: number): Promise<number> {
    const userClients = await this.getClientsByUserId(userId);
    return userClients.length;
  }

  async getItemsInStockCount(userId: number): Promise<number> {
    const userItems = await this.getItemsByUserId(userId);
    return userItems
      .filter(item => item.isInventory)
      .reduce((sum, item) => sum + (item.stockQuantity || 0), 0);
  }

  async getRevenueByMonth(userId: number, year: number): Promise<{month: number, revenue: number}[]> {
    const userInvoices = await this.getInvoicesByUserId(userId);
    
    // Initialize revenue for all months
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0
    }));
    
    // Calculate revenue for each month
    userInvoices
      .filter(invoice => 
        invoice.status === 'paid' && 
        invoice.issueDate.getFullYear() === year
      )
      .forEach(invoice => {
        const month = invoice.issueDate.getMonth();
        monthlyRevenue[month].revenue += invoice.total;
      });
    
    return monthlyRevenue;
  }

  async getInvoiceStatusSummary(userId: number): Promise<{status: string, count: number}[]> {
    const userInvoices = await this.getInvoicesByUserId(userId);
    
    // Count invoices by status
    const statusCount = new Map<string, number>();
    
    userInvoices.forEach(invoice => {
      const status = invoice.status;
      statusCount.set(status, (statusCount.get(status) || 0) + 1);
    });
    
    return Array.from(statusCount.entries()).map(([status, count]) => ({
      status,
      count
    }));
  }

  async getTopClients(userId: number, limit: number): Promise<any[]> {
    const userClients = await this.getClientsByUserId(userId);
    const result = [];
    
    for (const client of userClients) {
      const clientInvoices = await this.getInvoicesByClientId(client.id);
      
      // Calculate total revenue
      const totalRevenue = clientInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
      
      // Calculate payment stats
      const paid = clientInvoices.filter(invoice => invoice.status === 'paid').length;
      const pending = clientInvoices.filter(invoice => invoice.status === 'sent').length;
      const overdue = clientInvoices.filter(invoice => invoice.status === 'overdue').length;
      
      // Calculate payment rate
      const paymentRate = clientInvoices.length > 0 
        ? (paid / clientInvoices.length) * 100 
        : 0;
      
      // Get last activity date
      const lastActivityDate = clientInvoices.length > 0
        ? new Date(Math.max(...clientInvoices.map(inv => inv.createdAt.getTime())))
        : client.createdAt;
      
      result.push({
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email,
        revenue: totalRevenue,
        invoices: {
          total: clientInvoices.length,
          paid,
          pending,
          overdue
        },
        paymentRate,
        lastActivity: lastActivityDate
      });
    }
    
    // Sort by revenue (highest first) and take the top N
    return result
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
