import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { 
  Search, 
  Plus, 
  Package, 
  MoreVertical, 
  FileText, 
  Trash2, 
  Edit
} from "lucide-react";

interface Item {
  id: number;
  name: string;
  description: string;
  price: number;
  category?: string;
  isInventory: boolean;
  stockQuantity?: number;
}

interface ItemsListProps {
  items: Item[];
  isLoading?: boolean;
  onDeleteItem: (id: number) => void;
}

const ItemsList: React.FC<ItemsListProps> = ({
  items = [],
  isLoading = false,
  onDeleteItem
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter items based on search query
  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      (item.category && item.category.toLowerCase().includes(query)) ||
      formatCurrency(item.price).toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (filteredItems.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-primary-50 p-6 mb-4">
          <Package className="h-10 w-10 text-primary-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No items yet</h3>
        <p className="text-gray-500 mb-4">Add your first product or service to get started</p>
        <Link href="/items/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </Link>
      </div>
    );
  }

  if (filteredItems.length === 0 && searchQuery) {
    return (
      <div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500 mb-4">No items found matching "{searchQuery}"</p>
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            Clear search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Inventory</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {item.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {item.category ? (
                    <Badge variant="outline">{item.category}</Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>{formatCurrency(item.price)}</TableCell>
                <TableCell>
                  {item.isInventory ? (
                    <div className="flex items-center">
                      <Badge variant="secondary" className="mr-2">
                        In Stock
                      </Badge>
                      <span className="text-sm">
                        {item.stockQuantity !== undefined ? item.stockQuantity : 0} units
                      </span>
                    </div>
                  ) : (
                    <Badge variant="outline">Service</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <Link href={`/items/${item.id}`}>
                      <Button variant="ghost" size="icon" title="View Details">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </Link>
                    
                    <Link href={`/items/${item.id}/edit`}>
                      <Button variant="ghost" size="icon" title="Edit Item">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/items/${item.id}`}>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/items/${item.id}/edit`}>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Item
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem 
                          onClick={() => onDeleteItem(item.id)}
                          className="text-danger"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ItemsList;
