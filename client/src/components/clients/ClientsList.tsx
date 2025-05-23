import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";
import { Link } from "wouter";
import { 
  Search, 
  Plus, 
  Users, 
  MoreVertical, 
  FileText, 
  Trash2, 
  Edit
} from "lucide-react";
import { Avatar } from "../ui/avatar";

interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
}

interface ClientsListProps {
  clients: Client[];
  isLoading?: boolean;
  onDeleteClient: (id: number) => void;
}

const ClientsList: React.FC<ClientsListProps> = ({
  clients = [],
  isLoading = false,
  onDeleteClient
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter clients based on search query
  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      (client.company && client.company.toLowerCase().includes(query)) ||
      (client.phone && client.phone.toLowerCase().includes(query))
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (filteredClients.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full mb-4 p-6" style={{ background: 'linear-gradient(135deg, #FFB86C 60%, #fff 100%)' }}>
          <Users className="h-10 w-10 text-orange-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">No clients found</h3>
        <p className="text-white mb-4">Add your first client to get started</p>
        <Link href="/clients/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </Link>
      </div>
    );
  }

  if (filteredClients.length === 0 && searchQuery) {
    return (
      <div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full mb-4 p-6" style={{ background: 'linear-gradient(135deg, #FFB86C 60%, #fff 100%)' }}>
            <Users className="h-10 w-10 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No clients found</h3>
          <p className="text-white mb-4">No clients found matching "{searchQuery}"</p>
          <Button variant="outline" onClick={() => setSearchQuery("")}>Clear search</Button>
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
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client, index) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex items-center">
                    <Avatar name={client.name} size="sm" index={index} />
                    <span className="ml-2 font-medium">{client.name}</span>
                  </div>
                </TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.phone || "-"}</TableCell>
                <TableCell>{client.company || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <Link href={`/clients/${client.id}`}>
                      <Button variant="ghost" size="icon" title="View Details">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </Link>
                    
                    <Link href={`/clients/${client.id}/edit`}>
                      <Button variant="ghost" size="icon" title="Edit Client">
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
                        <Link href={`/clients/${client.id}`}>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/clients/${client.id}/edit`}>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Client
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem 
                          onClick={() => onDeleteClient(client.id)}
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

export default ClientsList;
