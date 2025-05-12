import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { insertInvoiceSchema } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

// Extend the schema with client validation rules
const invoiceFormSchema = z.object({
  invoice: insertInvoiceSchema.extend({
    issueDate: z.date(),
    dueDate: z.date(),
  }),
  items: z.array(
    z.object({
      id: z.number().optional(),
      itemId: z.number().optional().nullable(),
      description: z.string().min(1, "Description is required"),
      quantity: z.coerce.number().min(0.01, "Quantity must be positive"),
      price: z.coerce.number().min(0, "Price must be positive"),
      total: z.number(),
    })
  ).min(1, "At least one item is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormValues) => void;
  defaultValues?: InvoiceFormValues;
  isSubmitting?: boolean;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  onSubmit,
  defaultValues,
  isSubmitting = false,
}) => {
  const { user } = useAuth();
  const userId = user?.id;

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: [`/api/clients?userId=${userId}`],
    enabled: !!userId,
  });

  // Fetch items
  const { data: items = [] } = useQuery({
    queryKey: [`/api/items?userId=${userId}`],
    enabled: !!userId,
  });

  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);

  // Set up form with default values
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: defaultValues || {
      invoice: {
        userId: userId || 0,
        clientId: 0,
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        status: "draft",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        notes: "",
        isRecurring: false,
      },
      items: [
        {
          itemId: null,
          description: "",
          quantity: 1,
          price: 0,
          total: 0,
        },
      ],
    },
  });

  // Set up line items field array
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Update userId when user changes
  useEffect(() => {
    if (userId && !defaultValues) {
      form.setValue("invoice.userId", userId);
    }
  }, [userId, form, defaultValues]);

  // Calculate line item totals and invoice subtotal
  useEffect(() => {
    const items = form.getValues("items");
    
    let newSubtotal = 0;
    
    items.forEach((item, index) => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);
      const lineTotal = quantity * price;
      
      // Update the line total
      form.setValue(`items.${index}.total`, lineTotal);
      
      // Add to subtotal
      newSubtotal += lineTotal;
    });
    
    setSubtotal(newSubtotal);
    setTotal(newSubtotal);
    
    // Update invoice totals
    form.setValue("invoice.subtotal", newSubtotal);
    form.setValue("invoice.total", newSubtotal);
  }, [form.watch("items")]);

  const handleSubmit = (data: InvoiceFormValues) => {
    onSubmit(data);
  };

  // Handle selecting an item from the dropdown
  const handleItemSelect = (selectedItemId: number, index: number) => {
    const selectedItem = items.find((item: any) => item.id === selectedItemId);
    
    if (selectedItem) {
      form.setValue(`items.${index}.description`, selectedItem.name);
      form.setValue(`items.${index}.price`, selectedItem.price);
      form.setValue(`items.${index}.itemId`, selectedItem.id);
      
      // Recalculate the line total
      const quantity = form.getValues(`items.${index}.quantity`);
      form.setValue(`items.${index}.total`, quantity * selectedItem.price);
    }
  };

  // Add a new empty item line
  const addItem = () => {
    append({
      itemId: null,
      description: "",
      quantity: 1,
      price: 0,
      total: 0,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Invoice Details */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="invoice.invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number</FormLabel>
                  <FormControl>
                    <Input placeholder="INV-000123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoice.clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name} {client.company ? `(${client.company})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoice.status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="invoice.issueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoice.dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoice.isRecurring"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurring Invoice</FormLabel>
                  <Select
                    value={field.value ? "true" : "false"}
                    onValueChange={(value) => field.onChange(value === "true")}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Is this recurring?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="false">No</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Invoice Items</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-gray-500">
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-2">Total</div>
              <div className="col-span-1"></div>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 mb-3">
                <div className="col-span-5 space-y-2">
                  <Select
                    value={form.getValues(`items.${index}.itemId`)?.toString() || ""}
                    onValueChange={(value) => handleItemSelect(Number(value), index)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an item or enter custom" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item: any) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} ({formatCurrency(item.price)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.total`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            disabled
                            value={formatCurrency(field.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="col-span-1 flex items-center justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="flex justify-end">
          <div className="w-full md:w-1/3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Total:</span>
              <span className="font-semibold text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="invoice.notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any additional notes or payment terms..."
                  className="h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default InvoiceForm;
