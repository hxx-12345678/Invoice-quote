'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Document, Payment, PaymentMethod } from '@/lib/types';
import { toast } from 'sonner';
import {
  PaymentsStore,
  CustomersStore,
  formatCurrency,
  formatDate,
  UserSettingsStore,
  generateId,
} from '@/lib/store';
import {
  PlusCircle,
  CreditCard,
  Smartphone,
  Building2,
  Banknote,
  CheckCircle2,
  History,
} from 'lucide-react';

interface PaymentTrackerProps {
  document: Document;
  onPaymentRecorded: () => void;
}

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: React.ElementType }> = {
  cash: { label: 'Cash', icon: Banknote },
  upi: { label: 'UPI', icon: Smartphone },
  card: { label: 'Card', icon: CreditCard },
  bank_transfer: { label: 'Bank Transfer', icon: Building2 },
  cheque: { label: 'Cheque', icon: Building2 },
  paypal: { label: 'PayPal', icon: CreditCard },
  stripe: { label: 'Stripe', icon: CreditCard },
  other: { label: 'Other', icon: Banknote },
};

export function PaymentTracker({ document: doc, onPaymentRecorded }: PaymentTrackerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const settings = UserSettingsStore.get();
  const customer = CustomersStore.get(doc.customerId);

  const [paymentForm, setPaymentForm] = useState({
    amount: doc.amountDue.toString(),
    method: 'bank_transfer' as PaymentMethod,
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    setPayments(PaymentsStore.getByDocument(doc.id));
  }, [doc.id]);

  const handleAddPayment = () => {
    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) return;
    // Cap payment at outstanding balance to prevent overpayment
    const cappedAmount = Math.min(amount, doc.amountDue);
    if (cappedAmount <= 0) return;

    PaymentsStore.add({
      documentId: doc.id,
      amount: cappedAmount,
      paymentMethod: paymentForm.method,
      transactionId: paymentForm.transactionId || undefined,
      paymentDate: new Date(paymentForm.paymentDate),
      notes: paymentForm.notes || undefined,
      status: 'completed',
    });

    setPayments(PaymentsStore.getByDocument(doc.id));
    setPaymentForm({
      amount: '',
      method: 'bank_transfer' as PaymentMethod,
      transactionId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowAddPayment(false);
    toast.success(`Payment of ${formatCurrency(cappedAmount, doc.currency)} recorded successfully`);
    onPaymentRecorded();
  };

  const progressPercent = Math.min(100, (doc.amountPaid / doc.grandTotal) * 100);

  return (
    <div className="space-y-4">
      {/* Payment Progress */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Status
            </CardTitle>
            {doc.status !== 'paid' && doc.status !== 'cancelled' && (
              <Button size="sm" onClick={() => setShowAddPayment(true)} className="gap-1">
                <PlusCircle className="h-3 w-3" />
                Record Payment
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Invoice Total</p>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(doc.grandTotal, doc.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Paid</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(doc.amountPaid, doc.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Balance Due</p>
              <p className={`text-lg font-bold ${doc.amountDue > 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(doc.amountDue, doc.currency)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Payment Progress</span>
              <span>{progressPercent.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {doc.status === 'paid' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                Fully paid
                {doc.paidAt && ` on ${formatDate(doc.paidAt, settings?.dateFormat)}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="h-4 w-4" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="hidden sm:table-cell">Transaction ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const methodConfig = PAYMENT_METHOD_CONFIG[payment.paymentMethod];
                  const MethodIcon = methodConfig.icon;
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="text-sm">
                        {formatDate(payment.paymentDate, settings?.dateFormat)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MethodIcon className="h-3 w-3 text-muted-foreground" />
                          {methodConfig.label}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {payment.transactionId || '-'}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(payment.amount, doc.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            payment.status === 'completed'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : payment.status === 'failed'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Payment Dialog */}
      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment received for invoice {doc.documentNumber}
              {customer && ` from ${customer.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payAmount">Amount * (max: {formatCurrency(doc.amountDue, doc.currency)})</Label>
                <Input
                  id="payAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={doc.amountDue}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payDate">Payment Date *</Label>
                <Input
                  id="payDate"
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select
                value={paymentForm.method}
                onValueChange={(value) => setPaymentForm(prev => ({ ...prev, method: value as PaymentMethod }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID / Reference</Label>
              <Input
                id="transactionId"
                placeholder="UTR / Transaction reference"
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionId: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payNotes">Notes</Label>
              <Input
                id="payNotes"
                placeholder="Optional note"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Invoice Total</span>
                <span>{formatCurrency(doc.grandTotal, doc.currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground mt-1">
                <span>Already Paid</span>
                <span>{formatCurrency(doc.amountPaid, doc.currency)}</span>
              </div>
              <div className="flex justify-between font-semibold text-foreground mt-1 pt-1 border-t border-border">
                <span>Balance Due</span>
                <span>{formatCurrency(doc.amountDue, doc.currency)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddPayment(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddPayment}
                disabled={!paymentForm.amount || parseFloat(paymentForm.amount) <= 0}
              >
                Record Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
