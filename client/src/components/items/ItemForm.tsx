import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { insertItemSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

// Extend the schema with item validation rules
const itemFormSchema = insertItemSchema.extend({
  price: z.coerce.number().min(0, "Price must be a positive number"),
  stockQuantity: z.coerce.number().min(0, "Stock quantity must be a positive number").optional(),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

interface ItemFormProps {
  onSubmit: (data: ItemFormValues) => void;
  defaultValues?: Partial<ItemFormValues>;
  isSubmitting?: boolean;
}

const ItemForm: React.FC<ItemFormProps> = ({
  onSubmit,
  defaultValues,
  isSubmitting = false,
}) => {
  const { user } = useAuth();
  const userId = user?.id;

  // Set up form with default values
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      userId: userId || 0,
      name: "",
      description: "",
      price: 0,
      category: "",
      isInventory: false,
      stockQuantity: 0,
      ...defaultValues,
    },
  });

  const watchIsInventory = form.watch("isInventory");

  const handleSubmit = (data: ItemFormValues) => {
    // If not an inventory item, remove stockQuantity
    if (!data.isInventory) {
      data.stockQuantity = undefined;
    }
    
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Web Design Service" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Services" {...field} />
                  </FormControl>
                  <FormDescription>
                    Categorize your items for better organization
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price*</FormLabel>
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

          {/* Inventory Information */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the item..."
                      className="h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isInventory"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Track Inventory
                    </FormLabel>
                    <FormDescription>
                      Enable stock tracking for physical products
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {watchIsInventory && (
              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {/* Hidden field for userId */}
        <input type="hidden" {...form.register("userId")} />

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Item"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ItemForm;
