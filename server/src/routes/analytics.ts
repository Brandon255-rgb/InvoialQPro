import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { storage } from '../../storage';

const router = Router();

// Dashboard analytics endpoint
router.get('/dashboard', auth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = user.id;
    
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
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Failed to fetch analytics data" });
  }
});

export default router; 