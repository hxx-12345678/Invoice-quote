'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Customer } from '@/lib/types';
import { CustomersStore, formatCurrency, BusinessProfileStore } from '@/lib/store';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  Building2,
  UserPlus
} from 'lucide-react';
import { CustomerForm } from './customer-form';
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { ApiService } from '@/lib/api-service';
import { toast } from 'sonner';

interface CustomerListProps {
  onSelectCustomer?: (customer: Customer) => void;
  selectionMode?: boolean;
}

export function CustomerList({ onSelectCustomer, selectionMode = false }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const profile = BusinessProfileStore.get();
      if (!profile?.id) {
        // Fallback to local store if no profile
        setCustomers(CustomersStore.getAll());
        return;
      }
      const response = await ApiService.customers.getAll(profile.id);
      const data = response.data.data || response.data;
      if (Array.isArray(data)) {
        setCustomers(data);
        // Sync local store
        CustomersStore.setAll(data);
      } else {
        setCustomers(CustomersStore.getAll());
      }
    } catch (error) {
      console.error('Failed to load customers from API:', error);
      // Fallback to local store on error
      setCustomers(CustomersStore.getAll());
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = searchQuery
    ? CustomersStore.search(searchQuery)
    : customers;

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer? This cannot be undone.')) {
      try {
        await ApiService.customers.delete(id);
        CustomersStore.delete(id);
        toast.success('Customer deleted successfully');
        loadCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        // Attempt local deletion if API fails or customer is local-only
        const success = CustomersStore.delete(id);
        if (!success) {
          alert('Cannot delete this customer — they have existing invoices or quotes. Deactivate them instead.');
          CustomersStore.deactivate(id);
        } else {
          toast.success('Local customer deleted successfully');
        }
        loadCustomers();
      }
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleFormComplete = () => {
    setShowForm(false);
    setEditingCustomer(undefined);
    loadCustomers();
  };

  if (showForm) {
    return (
      <CustomerForm
        customer={editingCustomer}
        onComplete={handleFormComplete}
        onCancel={() => {
          setShowForm(false);
          setEditingCustomer(undefined);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Customers</h2>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary">{filteredCustomers.length} customers</Badge>
      </div>

      {filteredCustomers.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <UserPlus />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No customers yet</EmptyTitle>
            <EmptyDescription>Add your first customer to start creating invoices</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="hidden sm:table-cell">Total Spent</TableHead>
                <TableHead className="hidden sm:table-cell">Outstanding</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow 
                  key={customer.id}
                  className={selectionMode ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => selectionMode && onSelectCustomer?.(customer)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{customer.name}</div>
                        {customer.companyName && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {customer.companyName}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {customer.email}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="text-sm">
                      {customer.billingAddress?.city}, {customer.billingAddress?.state}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {customer.billingAddress?.country}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="font-medium text-foreground">
                      {formatCurrency(customer.totalSpent, customer.currency)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className={customer.totalOutstanding > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                      {formatCurrency(customer.totalOutstanding, customer.currency)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {!selectionMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(customer)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(customer.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
