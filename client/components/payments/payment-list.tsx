'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  PaymentsStore, 
  CustomersStore, 
  DocumentsStore,
  formatCurrency, 
  formatDate,
  UserSettingsStore,
  BusinessProfileStore
} from '@/lib/store';
import { Payment, PaymentMethod } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CreditCard,
  Search,
  Plus,
  Filter,
  Download,
  Calendar,
  User,
  ArrowUpRight,
  TrendingUp,
  Smartphone,
  Building2,
  Banknote,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: React.ElementType; color: string }> = {
  cash: { label: 'Cash', icon: Banknote, color: 'text-green-600' },
  upi: { label: 'UPI', icon: Smartphone, color: 'text-purple-600' },
  card: { label: 'Card', icon: CreditCard, color: 'text-blue-600' },
  bank_transfer: { label: 'Bank Transfer', icon: Building2, color: 'text-orange-600' },
  cheque: { label: 'Cheque', icon: Building2, color: 'text-slate-600' },
  paypal: { label: 'PayPal', icon: CreditCard, color: 'text-blue-500' },
  stripe: { label: 'Stripe', icon: CreditCard, color: 'text-indigo-600' },
  other: { label: 'Other', icon: Banknote, color: 'text-gray-600' },
};

export function PaymentList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const settings = UserSettingsStore.get();
  const currency = settings?.currency || 'INR';

  useEffect(() => {
    const allPayments = PaymentsStore.getAll();
    setPayments(allPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()));
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const doc = DocumentsStore.get(p.documentId);
      const customer = doc ? CustomersStore.get(doc.customerId) : null;
      
      const matchesSearch = !searchQuery || 
        (customer?.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc?.documentNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()));
        
      return matchesSearch;
    });
  }, [payments, searchQuery]);

  const totalReceived = useMemo(() => {
    return filteredPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Payment History</h2>
          <p className="text-muted-foreground text-sm">Track all incoming payments and transactions</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="gap-2 flex-1 sm:flex-none">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-950/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Received</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Transactions</p>
                <p className="text-2xl font-bold text-foreground">{filteredPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Last 30 Days</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(
                    filteredPayments
                      .filter(p => new Date(p.paymentDate).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000)
                      .reduce((sum, p) => sum + p.amount, 0),
                    currency
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, invoice #, or transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Transaction Date</TableHead>
              <TableHead>Customer & Invoice</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="hidden md:table-cell">Transaction ID</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => {
                const doc = DocumentsStore.get(payment.documentId);
                const customer = doc ? CustomersStore.get(doc.customerId) : null;
                const method = PAYMENT_METHOD_CONFIG[payment.paymentMethod];
                const MethodIcon = method.icon;

                return (
                  <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-sm">
                      {formatDate(payment.paymentDate, settings?.dateFormat)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{customer?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3" />
                          {doc?.documentNumber || 'Ref Missing'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MethodIcon className={`h-4 w-4 ${method.color}`} />
                        {method.label}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs font-mono text-muted-foreground">
                        {payment.transactionId || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(payment.amount, doc?.currency || currency)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={
                          payment.status === 'completed' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {}}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            Download Receipt
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
