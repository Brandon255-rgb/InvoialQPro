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
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  
  // Client operations
  getClient(id: string): Promise<Client | undefined>;
  getClientsByUserId(userId: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  
  // Item operations
  getItem(id: string): Promise<Item | undefined>;
  getItemsByUserId(userId: string): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, item: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: string): Promise<boolean>;
  
  // Invoice operations
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByUserId(userId: string): Promise<Invoice[]>;
  getInvoicesByClientId(clientId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  
  // Invoice items operations
  getInvoiceItem(id: string): Promise<InvoiceItem | undefined>;
  getInvoiceItems(): Promise<InvoiceItem[]>;
  getInvoiceItemsByInvoiceId(invoiceId: string): Promise<InvoiceItem[]>;
  createInvoiceItem(invoiceItem: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: string, invoiceItem: Partial<InvoiceItem>): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: string): Promise<boolean>;
  
  // Reminder operations
  getReminder(id: string): Promise<Reminder | undefined>;
  getRemindersByUserId(userId: string): Promise<Reminder[]>;
  getRemindersByInvoiceId(invoiceId: string): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, reminder: Partial<Reminder>): Promise<Reminder | undefined>;
  deleteReminder(id: string): Promise<boolean>;

  // Analytics operations
  getTotalRevenue(userId: string): Promise<number>;
  getOutstandingAmount(userId: string): Promise<number>;
  getActiveClientsCount(userId: string): Promise<number>;
  getItemsInStockCount(userId: string): Promise<number>;
  getRevenueByMonth(userId: string, year: number): Promise<{month: number, revenue: number}[]>;
  getInvoiceStatusSummary(userId: string): Promise<{status: string, count: number}[]>;
  getTopClients(userId: string, limit: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private clients: Map<string, Client>;
  private items: Map<string, Item>;
  private invoices: Map<string, Invoice>;
  private invoiceItems: Map<string, InvoiceItem>;
  private reminders: Map<string, Reminder>;
  
  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.items = new Map();
    this.invoices = new Map();
    this.invoiceItems = new Map();
    this.reminders = new Map();
  }

  private async setupSampleData(userId: string) {
    // Create some clients
    const client1 = await this.createClient({
      id: 1,
      userId: userId,
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+1 (555) 123-4567',
      company: 'Acme Corp',
      address: '123 Main St, San Francisco, CA',
      notes: 'Software Development client'
    });

    const client2 = await this.createClient({
      id: 2,
      userId: userId,
      name: 'Global Solutions',
      email: 'info@globalsolutions.com',
      phone: '+1 (555) 987-6543',
      company: 'Global Solutions Ltd',
      address: '456 Market St, New York, NY',
      notes: 'Consulting Services client'
    });

    const client3 = await this.createClient({
      id: 3,
      userId: userId,
      name: 'TechCorp Inc.',
      email: 'support@techcorp.com',
      phone: '+1 (555) 789-0123',
      company: 'TechCorp Incorporated',
      address: '789 Tech Blvd, Austin, TX',
      notes: 'Web Development client'
    });

    // Create some items
    await this.createItem({
      id: 1,
      userId: userId,
      name: 'Web Design',
      description: 'Professional web design services',
      price: 1500,
      category: 'Services',
      isInventory: false
    });

    await this.createItem({
      id: 2,
      userId: userId,
      name: 'App Development',
      description: 'Mobile application development',
      price: 3000,
      category: 'Services',
      isInventory: false
    });

    await this.createItem({
      id: 3,
      userId: userId,
      name: 'SEO Package',
      description: 'Search engine optimization services',
      price: 800,
      category: 'Services',
      isInventory: false
    });

    await this.createItem({
      id: 4,
      userId: userId,
      name: 'Server Hardware',
      description: 'Dell PowerEdge R740 Server',
      price: 2500,
      category: 'Hardware',
      isInventory: true,
      stockQuantity: 5
    });

    // Create some invoices
    const invoice1 = await this.createInvoice({
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

    const invoice2 = await this.createInvoice({
      userId,
      clientId: client2.id,
      invoiceNumber: 'INV-2023',
      status: 'sent',
      issueDate: new Date('2023-08-01'),
      dueDate: new Date('2023-08-15'),
      subtotal: 3000,
      tax: 0,
      discount: 0,
      total: 3000,
      notes: 'Please process payment within 15 days'
    });

    const invoice3 = await this.createInvoice({
      userId,
      clientId: client3.id,
      invoiceNumber: 'INV-2022',
      status: 'draft',
      issueDate: new Date('2023-09-01'),
      dueDate: new Date('2023-09-15'),
      subtotal: 800,
      tax: 0,
      discount: 0,
      total: 800,
      notes: 'Draft invoice for SEO services'
    });

    // Add invoice items
    await this.createInvoiceItem({
      invoiceId: invoice1.id,
      itemId: 1,
      description: 'Web Design Services',
      quantity: 1,
      price: 1500,
      total: 1500
    });

    await this.createInvoiceItem({
      invoiceId: invoice1.id,
      itemId: 3,
      description: 'SEO Package',
      quantity: 1,
      price: 800,
      total: 800
    });

    await this.createInvoiceItem({
      invoiceId: invoice1.id,
      itemId: 4,
      description: 'Server Hardware',
      quantity: 1,
      price: 2500,
      total: 2500
    });

    await this.createInvoiceItem({
      invoiceId: invoice2.id,
      itemId: 3,
      description: 'SEO Package',
      quantity: 1,
      price: 800,
      total: 800
    });

    await this.createInvoiceItem({
      invoiceId: invoice2.id,
      itemId: 1,
      description: 'Web Design',
      quantity: 1,
      price: 1500,
      total: 1500
    });

    await this.createInvoiceItem({
      invoiceId: invoice3.id,
      itemId: 2,
      description: 'App Development',
      quantity: 1,
      price: 3000,
      total: 3000
    });

    await this.createInvoiceItem({
      invoiceId: invoice3.id,
      itemId: 3,
      description: 'SEO Package',
      quantity: 1,
      price: 800,
      total: 800
    });

    // Add reminders
    await this.createReminder({
      userId,
      invoiceId: invoice2.id,
      title: 'Invoice #2023 reminder',
      description: 'Send payment reminder to Global Solutions',
      dueDate: new Date('2023-08-20'),
      isCompleted: false
    });

    await this.createReminder({
      userId,
      invoiceId: invoice3.id,
      title: 'Follow up on overdue invoice',
      description: 'Call TechCorp regarding Invoice #2022',
      dueDate: new Date('2023-09-20'),
      isCompleted: false
    });
  }

  private validateUser(user: InsertUser): void {
    if (!user.email || !user.name) {
      throw new Error("Missing required user fields");
    }
  }

  private validateClient(client: InsertClient): void {
    if (!client.name || !client.email) {
      throw new Error("Missing required client fields");
    }
  }

  private validateItem(item: InsertItem): void {
    if (!item.name || item.price === undefined) {
      throw new Error("Missing required item fields");
    }
    if (item.price < 0) {
      throw new Error("Price cannot be negative");
    }
  }

  private async validateInvoice(invoice: InsertInvoice): Promise<void> {
    if (!invoice.clientId || !invoice.invoiceNumber || !invoice.issueDate || !invoice.dueDate) {
      throw new Error("Missing required invoice fields");
    }
    if (invoice.total < 0) {
      throw new Error("Total cannot be negative");
    }
    
    // Verify client exists
    const client = await this.getClient(invoice.clientId);
    if (!client) {
      throw new Error("Client not found");
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      this.validateUser(user);
      
      // Check if email already exists
      const existingUser = await this.getUserByEmail(user.email);
      if (existingUser) {
        throw new Error("Email already in use");
      }
      
      const newUser: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        createdAt: new Date(),
      };
      
      this.users.set(newUser.id, newUser);
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Client operations
  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientsByUserId(userId: string): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(client => client.userId === userId);
  }

  async createClient(client: InsertClient): Promise<Client> {
    try {
      this.validateClient(client);
      
      const newClient: Client = {
        id: client.id,
        userId: client.userId,
        name: client.name,
        email: client.email,
        company: client.company || null,
        phone: client.phone || null,
        address: client.address || null,
        notes: client.notes || null,
        createdAt: new Date(),
      };
      
      this.clients.set(newClient.id, newClient);
      return newClient;
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  }

  async updateClient(id: string, clientData: Partial<Client>): Promise<Client | undefined> {
    const client = await this.getClient(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...clientData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Item operations
  async getItem(id: string): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async getItemsByUserId(userId: string): Promise<Item[]> {
    return Array.from(this.items.values()).filter(item => item.userId === userId);
  }

  async createItem(item: InsertItem): Promise<Item> {
    try {
      this.validateItem(item);
      
      const newItem: Item = {
        id: item.id,
        userId: item.userId,
        name: item.name,
        description: item.description || null,
        price: item.price,
        category: item.category || null,
        isInventory: item.isInventory || false,
        stockQuantity: item.stockQuantity || null,
        createdAt: new Date(),
      };
      
      this.items.set(newItem.id, newItem);
      return newItem;
    } catch (error) {
      console.error("Error creating item:", error);
      throw error;
    }
  }

  async updateItem(id: string, itemData: Partial<Item>): Promise<Item | undefined> {
    const item = await this.getItem(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemData };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async deleteItem(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  // Invoice operations
  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }
  
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoicesByUserId(userId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.userId === userId);
  }

  async getInvoicesByClientId(clientId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.clientId === clientId);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    try {
      await this.validateInvoice(invoice);
      
      const newInvoice: Invoice = {
        id: invoice.id,
        userId,
        clientId: invoice.clientId,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status || 'draft',
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        subtotal: invoice.subtotal,
        tax: invoice.tax || 0,
        discount: invoice.discount || 0,
        total: invoice.total,
        notes: invoice.notes || null,
        isRecurring: invoice.isRecurring || false,
        frequency: invoice.frequency || null,
        nextInvoiceDate: invoice.nextInvoiceDate || null,
        createdAt: new Date(),
      };
      
      this.invoices.set(newInvoice.id, newInvoice);
      return newInvoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  }

  async updateInvoice(id: string, invoiceData: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = { ...invoice, ...invoiceData };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    // Delete related invoice items first
    const invoiceItems = await this.getInvoiceItemsByInvoiceId(id);
    invoiceItems.forEach(item => this.deleteInvoiceItem(item.id));
    
    // Delete related reminders
    const reminders = await this.getRemindersByInvoiceId(id);
    reminders.forEach(reminder => this.deleteReminder(reminder.id));
    
    return this.invoices.delete(id);
  }

  // Invoice items operations
  async getInvoiceItem(id: string): Promise<InvoiceItem | undefined> {
    return this.invoiceItems.get(id);
  }
  
  async getInvoiceItems(): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values());
  }

  async getInvoiceItemsByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values()).filter(item => item.invoiceId === invoiceId);
  }

  async createInvoiceItem(invoiceItem: InsertInvoiceItem): Promise<InvoiceItem> {
    try {
      const newInvoiceItem: InvoiceItem = {
        id: invoiceItem.id,
        invoiceId: invoiceItem.invoiceId,
        itemId: invoiceItem.itemId || null,
        description: invoiceItem.description,
        quantity: invoiceItem.quantity,
        price: invoiceItem.price,
        total: invoiceItem.total,
      };
      
      this.invoiceItems.set(newInvoiceItem.id, newInvoiceItem);
      return newInvoiceItem;
    } catch (error) {
      console.error("Error creating invoice item:", error);
      throw error;
    }
  }

  async updateInvoiceItem(id: string, itemData: Partial<InvoiceItem>): Promise<InvoiceItem | undefined> {
    const invoiceItem = await this.getInvoiceItem(id);
    if (!invoiceItem) return undefined;
    
    const updatedInvoiceItem = { ...invoiceItem, ...itemData };
    this.invoiceItems.set(id, updatedInvoiceItem);
    return updatedInvoiceItem;
  }

  async deleteInvoiceItem(id: string): Promise<boolean> {
    return this.invoiceItems.delete(id);
  }

  // Reminder operations
  async getReminder(id: string): Promise<Reminder | undefined> {
    return this.reminders.get(id);
  }

  async getRemindersByUserId(userId: string): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(reminder => reminder.userId === userId);
  }

  async getRemindersByInvoiceId(invoiceId: string): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(reminder => reminder.invoiceId === invoiceId);
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    try {
      const newReminder: Reminder = {
        id: reminder.id,
        userId,
        invoiceId: reminder.invoiceId || null,
        title: reminder.title,
        description: reminder.description || null,
        dueDate: reminder.dueDate,
        isCompleted: reminder.isCompleted || false,
        createdAt: new Date(),
      };
      
      this.reminders.set(newReminder.id, newReminder);
      return newReminder;
    } catch (error) {
      console.error("Error creating reminder:", error);
      throw error;
    }
  }

  async updateReminder(id: string, reminderData: Partial<Reminder>): Promise<Reminder | undefined> {
    const reminder = await this.getReminder(id);
    if (!reminder) return undefined;
    
    const updatedReminder = { ...reminder, ...reminderData };
    this.reminders.set(id, updatedReminder);
    return updatedReminder;
  }

  async deleteReminder(id: string): Promise<boolean> {
    return this.reminders.delete(id);
  }

  // Analytics operations
  async getTotalRevenue(userId: string): Promise<number> {
    const userInvoices = await this.getInvoicesByUserId(userId);
    return userInvoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0);
  }

  async getOutstandingAmount(userId: string): Promise<number> {
    const userInvoices = await this.getInvoicesByUserId(userId);
    return userInvoices
      .filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + invoice.total, 0);
  }

  async getActiveClientsCount(userId: string): Promise<number> {
    const userClients = await this.getClientsByUserId(userId);
    return userClients.length;
  }

  async getItemsInStockCount(userId: string): Promise<number> {
    const userItems = await this.getItemsByUserId(userId);
    return userItems
      .filter(item => item.isInventory)
      .reduce((sum, item) => sum + (item.stockQuantity || 0), 0);
  }

  async getRevenueByMonth(userId: string, year: number): Promise<{month: number, revenue: number}[]> {
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

  async getInvoiceStatusSummary(userId: string): Promise<{status: string, count: number}[]> {
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

  async getTopClients(userId: string, limit: number): Promise<any[]> {
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
