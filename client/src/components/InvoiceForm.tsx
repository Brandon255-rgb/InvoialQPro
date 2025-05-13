import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Invoice, Client, InvoiceItem } from '@shared/schema';
import { api } from '../api';

interface InvoiceFormProps {
  clients: Client[];
  onSave: (invoice: Invoice) => void;
}

export function InvoiceForm({ clients, onSave }: InvoiceFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    subtotal: 0,
    tax: 0,
    total: 0,
    notes: '',
    isRecurring: false,
    frequency: 'monthly',
    nextInvoiceDate: undefined,
  });
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await api.getInvoice(id!);
      setInvoice(data);
      const items = await api.getInvoiceItems(id!);
      setItems(items);
    } catch (err) {
      setError('Failed to load invoice');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (invoice.isRecurring) {
        const { nextInvoiceDate, ...baseInvoice } = invoice;
        const schedule = {
          frequency: invoice.frequency,
          startDate: new Date(invoice.issueDate!),
          endDate: invoice.nextInvoiceDate ? new Date(invoice.nextInvoiceDate) : undefined,
        };
        const data = await api.createRecurringInvoice(baseInvoice, schedule);
        onSave(data);
      } else {
        const data = id
          ? await api.updateInvoice(id, invoice)
          : await api.createInvoice(invoice);
        onSave(data);
      }

      navigate('/invoices');
    } catch (err) {
      setError('Failed to save invoice');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);

    // Recalculate totals
    const subtotal = newItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.1; // 10% tax rate
    const total = subtotal + tax;

    setInvoice(prev => ({
      ...prev,
      subtotal,
      tax,
      total,
    }));
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: '',
        invoiceId: id || '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Invoice Number
          </label>
          <input
            type="text"
            value={invoice.invoiceNumber}
            onChange={e => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Client
          </label>
          <select
            value={invoice.clientId}
            onChange={e => setInvoice(prev => ({ ...prev, clientId: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="">Select a client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Issue Date
          </label>
          <input
            type="date"
            value={invoice.issueDate}
            onChange={e => setInvoice(prev => ({ ...prev, issueDate: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Due Date
          </label>
          <input
            type="date"
            value={invoice.dueDate}
            onChange={e => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={invoice.status}
            onChange={e => setInvoice(prev => ({ ...prev, status: e.target.value as Invoice['status'] }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={invoice.isRecurring}
              onChange={e => setInvoice(prev => ({ ...prev, isRecurring: e.target.checked }))}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">Recurring Invoice</span>
          </label>
        </div>

        {invoice.isRecurring && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Frequency
              </label>
              <select
                value={invoice.frequency}
                onChange={e => setInvoice(prev => ({ ...prev, frequency: e.target.value as Invoice['frequency'] }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={invoice.nextInvoiceDate?.split('T')[0] || ''}
                onChange={e => setInvoice(prev => ({ ...prev, nextInvoiceDate: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Items</h3>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Item
          </button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-5">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                value={item.description}
                onChange={e => handleItemChange(index, 'description', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={e => {
                  const quantity = parseInt(e.target.value);
                  const amount = quantity * item.unitPrice;
                  handleItemChange(index, 'quantity', quantity);
                  handleItemChange(index, 'amount', amount);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Unit Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={e => {
                  const unitPrice = parseFloat(e.target.value);
                  const amount = item.quantity * unitPrice;
                  handleItemChange(index, 'unitPrice', unitPrice);
                  handleItemChange(index, 'amount', amount);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.amount}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
              />
            </div>

            <div className="col-span-1">
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="inline-flex items-center p-2 border border-transparent text-sm font-medium rounded-md text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            value={invoice.notes}
            onChange={e => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">Subtotal:</span>
            <span className="text-sm text-gray-900">${invoice.subtotal?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">Tax (10%):</span>
            <span className="text-sm text-gray-900">${invoice.tax?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-base font-medium text-gray-900">Total:</span>
            <span className="text-base font-medium text-gray-900">${invoice.total?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => navigate('/invoices')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? 'Saving...' : 'Save Invoice'}
        </button>
      </div>
    </form>
  );
} 