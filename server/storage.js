export class MemStorage {
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
            email: 'admin@invoiaiqpro.com',
            password: 'password123',
            name: 'Administrator',
            role: 'admin',
            status: 'active',
            company: 'invoiaiqpro Inc.'
        });
        // Add some sample data for the admin user
        this.setupSampleData(1);
    }
    async setupSampleData(userId) {
        // Create some clients
        const client1 = await this.createClient({
            userId,
            name: 'Acme Corporation',
            email: 'contact@acme.com',
            phone: '+1 (555) 123-4567',
            company: 'Acme Corp',
            address: '123 Main St, San Francisco, CA',
            notes: 'Software Development client'
        });
        const client2 = await this.createClient({
            userId,
            name: 'Global Solutions',
            email: 'info@globalsolutions.com',
            phone: '+1 (555) 987-6543',
            company: 'Global Solutions Ltd',
            address: '456 Market St, New York, NY',
            notes: 'Consulting Services client'
        });
        const client3 = await this.createClient({
            userId,
            name: 'TechCorp Inc.',
            email: 'support@techcorp.com',
            phone: '+1 (555) 789-0123',
            company: 'TechCorp Incorporated',
            address: '789 Tech Blvd, Austin, TX',
            notes: 'Web Development client'
        });
        // Create some items
        await this.createItem({
            userId,
            name: 'Web Design',
            description: 'Professional web design services',
            price: 1500,
            category: 'Services',
            isInventory: false
        });
        await this.createItem({
            userId,
            name: 'App Development',
            description: 'Mobile application development',
            price: 3000,
            category: 'Services',
            isInventory: false
        });
        await this.createItem({
            userId,
            name: 'SEO Package',
            description: 'Search engine optimization services',
            price: 800,
            category: 'Services',
            isInventory: false
        });
        await this.createItem({
            userId,
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
    validateUser(user) {
        if (!user.email || !user.password || !user.name) {
            throw new Error("Missing required user fields");
        }
        if (user.password.length < 8) {
            throw new Error("Password must be at least 8 characters long");
        }
    }
    validateClient(client) {
        if (!client.name || !client.email) {
            throw new Error("Missing required client fields");
        }
    }
    validateItem(item) {
        if (!item.name || item.price === undefined) {
            throw new Error("Missing required item fields");
        }
        if (item.price < 0) {
            throw new Error("Price cannot be negative");
        }
    }
    async validateInvoice(invoice) {
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
    async getUser(id) {
        return this.users.get(id);
    }
    async getUserByEmail(email) {
        return Array.from(this.users.values()).find(user => user.email === email);
    }
    async createUser(user) {
        try {
            this.validateUser(user);
            // Check if email already exists
            const existingUser = await this.getUserByEmail(user.email);
            if (existingUser) {
                throw new Error("Email already in use");
            }
            const newUser = {
                id: this.userIdCounter++,
                email: user.email,
                password: user.password,
                name: user.name,
                role: user.role || 'user',
                status: user.status || 'active',
                company: user.company || null,
                phone: user.phone || null,
                address: user.address || null,
                createdAt: new Date(),
            };
            this.users.set(newUser.id, newUser);
            return newUser;
        }
        catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    }
    async updateUser(id, userData) {
        const user = await this.getUser(id);
        if (!user)
            return undefined;
        const updatedUser = { ...user, ...userData };
        this.users.set(id, updatedUser);
        return updatedUser;
    }
    // Client operations
    async getClient(id) {
        return this.clients.get(id);
    }
    async getClientsByUserId(userId) {
        return Array.from(this.clients.values()).filter(client => client.userId === userId);
    }
    async createClient(client) {
        try {
            this.validateClient(client);
            const newClient = {
                id: this.clientIdCounter++,
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
        }
        catch (error) {
            console.error("Error creating client:", error);
            throw error;
        }
    }
    async updateClient(id, clientData) {
        const client = await this.getClient(id);
        if (!client)
            return undefined;
        const updatedClient = { ...client, ...clientData };
        this.clients.set(id, updatedClient);
        return updatedClient;
    }
    async deleteClient(id) {
        return this.clients.delete(id);
    }
    // Item operations
    async getItem(id) {
        return this.items.get(id);
    }
    async getItemsByUserId(userId) {
        return Array.from(this.items.values()).filter(item => item.userId === userId);
    }
    async createItem(item) {
        try {
            this.validateItem(item);
            const newItem = {
                id: this.itemIdCounter++,
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
        }
        catch (error) {
            console.error("Error creating item:", error);
            throw error;
        }
    }
    async updateItem(id, itemData) {
        const item = await this.getItem(id);
        if (!item)
            return undefined;
        const updatedItem = { ...item, ...itemData };
        this.items.set(id, updatedItem);
        return updatedItem;
    }
    async deleteItem(id) {
        return this.items.delete(id);
    }
    // Invoice operations
    async getInvoice(id) {
        return this.invoices.get(id);
    }
    async getInvoices() {
        return Array.from(this.invoices.values());
    }
    async getInvoicesByUserId(userId) {
        return Array.from(this.invoices.values()).filter(invoice => invoice.userId === userId);
    }
    async getInvoicesByClientId(clientId) {
        return Array.from(this.invoices.values()).filter(invoice => invoice.clientId === clientId);
    }
    async createInvoice(invoice) {
        try {
            await this.validateInvoice(invoice);
            const newInvoice = {
                id: this.invoiceIdCounter++,
                userId: invoice.userId,
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
        }
        catch (error) {
            console.error("Error creating invoice:", error);
            throw error;
        }
    }
    async updateInvoice(id, invoiceData) {
        const invoice = await this.getInvoice(id);
        if (!invoice)
            return undefined;
        const updatedInvoice = { ...invoice, ...invoiceData };
        this.invoices.set(id, updatedInvoice);
        return updatedInvoice;
    }
    async deleteInvoice(id) {
        // Delete related invoice items first
        const invoiceItems = await this.getInvoiceItemsByInvoiceId(id);
        invoiceItems.forEach(item => this.deleteInvoiceItem(item.id));
        // Delete related reminders
        const reminders = await this.getRemindersByInvoiceId(id);
        reminders.forEach(reminder => this.deleteReminder(reminder.id));
        return this.invoices.delete(id);
    }
    // Invoice items operations
    async getInvoiceItem(id) {
        return this.invoiceItems.get(id);
    }
    async getInvoiceItems() {
        return Array.from(this.invoiceItems.values());
    }
    async getInvoiceItemsByInvoiceId(invoiceId) {
        return Array.from(this.invoiceItems.values()).filter(item => item.invoiceId === invoiceId);
    }
    async createInvoiceItem(invoiceItem) {
        try {
            const newInvoiceItem = {
                id: this.invoiceItemIdCounter++,
                invoiceId: invoiceItem.invoiceId,
                itemId: invoiceItem.itemId || null,
                description: invoiceItem.description,
                quantity: invoiceItem.quantity,
                price: invoiceItem.price,
                total: invoiceItem.total,
            };
            this.invoiceItems.set(newInvoiceItem.id, newInvoiceItem);
            return newInvoiceItem;
        }
        catch (error) {
            console.error("Error creating invoice item:", error);
            throw error;
        }
    }
    async updateInvoiceItem(id, itemData) {
        const invoiceItem = await this.getInvoiceItem(id);
        if (!invoiceItem)
            return undefined;
        const updatedInvoiceItem = { ...invoiceItem, ...itemData };
        this.invoiceItems.set(id, updatedInvoiceItem);
        return updatedInvoiceItem;
    }
    async deleteInvoiceItem(id) {
        return this.invoiceItems.delete(id);
    }
    // Reminder operations
    async getReminder(id) {
        return this.reminders.get(id);
    }
    async getRemindersByUserId(userId) {
        return Array.from(this.reminders.values()).filter(reminder => reminder.userId === userId);
    }
    async getRemindersByInvoiceId(invoiceId) {
        return Array.from(this.reminders.values()).filter(reminder => reminder.invoiceId === invoiceId);
    }
    async createReminder(reminder) {
        try {
            const newReminder = {
                id: this.reminderIdCounter++,
                userId: reminder.userId,
                invoiceId: reminder.invoiceId || null,
                title: reminder.title,
                description: reminder.description || null,
                dueDate: reminder.dueDate,
                isCompleted: reminder.isCompleted || false,
                createdAt: new Date(),
            };
            this.reminders.set(newReminder.id, newReminder);
            return newReminder;
        }
        catch (error) {
            console.error("Error creating reminder:", error);
            throw error;
        }
    }
    async updateReminder(id, reminderData) {
        const reminder = await this.getReminder(id);
        if (!reminder)
            return undefined;
        const updatedReminder = { ...reminder, ...reminderData };
        this.reminders.set(id, updatedReminder);
        return updatedReminder;
    }
    async deleteReminder(id) {
        return this.reminders.delete(id);
    }
    // Analytics operations
    async getTotalRevenue(userId) {
        const userInvoices = await this.getInvoicesByUserId(userId);
        return userInvoices
            .filter(invoice => invoice.status === 'paid')
            .reduce((sum, invoice) => sum + invoice.total, 0);
    }
    async getOutstandingAmount(userId) {
        const userInvoices = await this.getInvoicesByUserId(userId);
        return userInvoices
            .filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue')
            .reduce((sum, invoice) => sum + invoice.total, 0);
    }
    async getActiveClientsCount(userId) {
        const userClients = await this.getClientsByUserId(userId);
        return userClients.length;
    }
    async getItemsInStockCount(userId) {
        const userItems = await this.getItemsByUserId(userId);
        return userItems
            .filter(item => item.isInventory)
            .reduce((sum, item) => sum + (item.stockQuantity || 0), 0);
    }
    async getRevenueByMonth(userId, year) {
        const userInvoices = await this.getInvoicesByUserId(userId);
        // Initialize revenue for all months
        const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            revenue: 0
        }));
        // Calculate revenue for each month
        userInvoices
            .filter(invoice => invoice.status === 'paid' &&
            invoice.issueDate.getFullYear() === year)
            .forEach(invoice => {
            const month = invoice.issueDate.getMonth();
            monthlyRevenue[month].revenue += invoice.total;
        });
        return monthlyRevenue;
    }
    async getInvoiceStatusSummary(userId) {
        const userInvoices = await this.getInvoicesByUserId(userId);
        // Count invoices by status
        const statusCount = new Map();
        userInvoices.forEach(invoice => {
            const status = invoice.status;
            statusCount.set(status, (statusCount.get(status) || 0) + 1);
        });
        return Array.from(statusCount.entries()).map(([status, count]) => ({
            status,
            count
        }));
    }
    async getTopClients(userId, limit) {
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
