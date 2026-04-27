'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Quote, QuoteItem, Customer, Product, TaxType, UnitType } from '@/lib/types';
import { ApiService } from '@/lib/api-service';
import {
  QuotesStore,
  QuoteVersionsStore,
  CustomersStore,
  ProductsStore,
  UserSettingsStore,
  BusinessProfileStore,
  calculateDocumentTotals,
  formatCurrency,
  formatDate,
  generateId,
  GST_TAX_RATES,
} from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  Save,
  Send,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Percent,
} from 'lucide-react';

interface QuoteFormProps {
  quote?: Quote;
  onComplete: (quote: Quote) => void;
  onCancel: () => void;
}

const UNITS: UnitType[] = ['pcs', 'kg', 'g', 'ltr', 'ml', 'hrs', 'days', 'sqft', 'sqm', 'nos', 'box', 'unit'];

function createEmptyItem(): QuoteItem {
  return {
    id: generateId(),
    name: '',
    description: '',
    quantity: 1,
    unit: 'pcs',
    unitPrice: 0,
    discountPercent: 0,
    discountAmount: 0,
    taxType: 'CGST',
    taxRate: 18,
    taxAmount: 0,
    totalBeforeTax: 0,
    totalAfterTax: 0,
    isOptional: false,
  };
}

function recalcItem(item: QuoteItem): QuoteItem {
  const lineTotal = item.quantity * item.unitPrice;
  // Percent discount takes priority; clamp discount to never exceed line total
  const rawDiscount = item.discountPercent > 0
    ? lineTotal * (item.discountPercent / 100)
    : (item.discountAmount || 0);
  const discountAmt = Math.min(rawDiscount, lineTotal);
  const totalBeforeTax = Math.max(0, lineTotal - discountAmt);
  const taxAmount = totalBeforeTax * (item.taxRate / 100);
  return {
    ...item,
    discountAmount: discountAmt,
    totalBeforeTax,
    taxAmount,
    totalAfterTax: totalBeforeTax + taxAmount,
  };
}

export function QuoteForm({ quote, onComplete, onCancel }: QuoteFormProps) {
  const settings = UserSettingsStore.get();
  const businessProfile = BusinessProfileStore.get();
  const customersList = useMemo(() => CustomersStore.getAll().filter(c => c.isActive), []);
  const productsList = useMemo(() => ProductsStore.getAll().filter(p => p.isActive), []);
  const isEdit = !!quote;

  const defaultExpiry = new Date();
  defaultExpiry.setDate(defaultExpiry.getDate() + 30);

  const [customerId, setCustomerId] = useState(quote?.customerId || '');
  const [issueDate, setIssueDate] = useState(
    quote ? new Date(quote.issueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [expiryDate, setExpiryDate] = useState(
    quote ? new Date(quote.expiryDate).toISOString().slice(0, 10) : defaultExpiry.toISOString().slice(0, 10)
  );
  const [currency, setCurrency] = useState(quote?.currency || settings?.currency || 'INR');
  const [referenceNumber, setReferenceNumber] = useState(quote?.referenceNumber || '');
  const [notes, setNotes] = useState(quote?.notes || settings?.defaultNotes || '');
  const [terms, setTerms] = useState(quote?.terms || settings?.defaultTerms || 'Thank you for your business!');
  const [items, setItems] = useState<QuoteItem[]>(quote?.items || [createEmptyItem()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [productSearchOpen, setProductSearchOpen] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    companyName: '',
  });

  const handleSaveNewCustomer = () => {
    if (!newCustomer.name || !newCustomer.email) {
      toast.error('Customer name and email are required');
      return;
    }

    const created = CustomersStore.add({
      userId: businessProfile?.userId || 'local',
      businessProfileId: businessProfile?.id || 'local',
      name: newCustomer.name.trim(),
      email: newCustomer.email.trim(),
      phone: newCustomer.phone?.trim(),
      companyName: newCustomer.companyName?.trim(),
      paymentTerms: 'due_on_receipt',
      currency: currency,
      isActive: true,
    });

    setCustomerId(created.id);
    setNewCustomerDialogOpen(false);
    setNewCustomer({ name: '', email: '', phone: '', companyName: '' });
    toast.success('Customer added successfully');
  };

  // Totals
  const totals = calculateDocumentTotals(
    items.map(i => ({
      ...i,
      id: i.id,
      taxType: i.taxType,
    }))
  );

  const updateItem = useCallback((id: string, field: keyof QuoteItem, value: unknown) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        return recalcItem(updated);
      })
    );
  }, []);

  const addItem = () => setItems(prev => [...prev, createEmptyItem()]);

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const applyProduct = (itemId: string, product: Product) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        return recalcItem({
          ...item,
          productId: product.id,
          name: product.name,
          description: product.description || '',
          hsnCode: product.hsnCode,
          sacCode: product.sacCode,
          unitPrice: product.unitPrice,
          unit: product.unit,
          taxRate: product.taxRate,
          taxType: product.taxType,
        });
      })
    );
    setProductSearchOpen(null);
    setProductQuery('');
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customerId = 'Please select a customer';
    if (!issueDate) errs.issueDate = 'Issue date is required';
    if (!expiryDate) errs.expiryDate = 'Expiry date is required';
    // Expiry must be strictly after issue date (not same day — a quote must have at least 1 day validity)
    if (expiryDate && issueDate && new Date(expiryDate) < new Date(issueDate)) {
      errs.expiryDate = 'Valid-until date must be on or after the issue date';
    }
    const nonEmptyItems = items.filter(i => i.name.trim());
    if (nonEmptyItems.length === 0) {
      errs.items = 'At least one line item with a name is required';
    }
    const hasZeroPrice = nonEmptyItems.some(i => i.unitPrice < 0);
    if (hasZeroPrice) {
      errs.items = errs.items || 'Line item prices cannot be negative';
    }
    const hasZeroQty = nonEmptyItems.some(i => i.quantity <= 0);
    if (hasZeroQty) {
      errs.items = errs.items || 'Line item quantities must be greater than 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (andSend = false) => {
    if (!validate()) return;
    setIsSaving(true);

    const quoteData = {
      userId: businessProfile?.userId || 'local',
      businessProfileId: businessProfile?.id || 'local',
      customerId,
      quoteNumber: quote?.quoteNumber || QuotesStore.getNextNumber(settings || {} as any),
      issueDate: new Date(issueDate),
      expiryDate: new Date(expiryDate),
      currency,
      exchangeRate: 1,
      items,
      ...totals,
      notes,
      terms,
      referenceNumber,
      status: (andSend ? 'sent' : 'draft') as Quote['status'],
      sentAt: andSend ? new Date() : undefined,
    };

    let result: Quote;
    if (isEdit && quote) {
      const updated = QuotesStore.update(
        quote.id,
        { ...quoteData, versionNumber: (quote.versionNumber || 1) + 1 },
        'edited',
        'Quote edited'
      );
      if (!updated) {
        setIsSaving(false);
        return;
      }
      // Save version snapshot
      QuoteVersionsStore.snapshot(updated, 'Manual edit');
      result = updated;
    } else {
      result = QuotesStore.add(quoteData);
    }

    setIsSaving(false);
    onComplete(result);
  };

  const filteredProducts = productsList.filter((p: any) =>
    !productQuery ||
    p.name.toLowerCase().includes(productQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productQuery.toLowerCase())
  );

  const selectedCustomer = customersList.find((c: any) => c.id === customerId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {isEdit ? `Edit ${quote.quoteNumber}` : 'New Quote'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Update quote details' : 'Create a new pricing proposal'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Main Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Quote Details */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Quote Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer */}
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="customer">Customer *</Label>
                  <Button variant="link" className="h-auto p-0 text-xs" onClick={() => setNewCustomerDialogOpen(true)}>
                    + Add New Customer
                  </Button>
                </div>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className={errors.customerId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customersList.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{c.name}</span>
                          {c.companyName && (
                            <span className="text-xs text-muted-foreground">{c.companyName}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customerId && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.customerId}
                  </p>
                )}

                <Dialog open={newCustomerDialogOpen} onOpenChange={setNewCustomerDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                      <DialogDescription>Enter basic details to create a customer instantly.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input
                        placeholder="Customer Name *"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      />
                      <Input
                        placeholder="Email Address *"
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      />
                      <Input
                        placeholder="Phone Number"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      />
                      <Input
                        placeholder="Company Name"
                        value={newCustomer.companyName}
                        onChange={(e) => setNewCustomer({ ...newCustomer, companyName: e.target.value })}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewCustomerDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveNewCustomer}>Save Customer</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Issue Date */}
              <div>
                <Label htmlFor="issueDate">Issue Date *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className={errors.issueDate ? 'border-destructive' : ''}
                />
                {errors.issueDate && (
                  <p className="text-xs text-destructive mt-1">{errors.issueDate}</p>
                )}
              </div>

              {/* Expiry Date */}
              <div>
                <Label htmlFor="expiryDate">Valid Until *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className={errors.expiryDate ? 'border-destructive' : ''}
                />
                {errors.expiryDate && (
                  <p className="text-xs text-destructive mt-1">{errors.expiryDate}</p>
                )}
              </div>

              {/* Currency */}
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reference */}
              <div>
                <Label htmlFor="reference">Reference / PO Number</Label>
                <Input
                  id="reference"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  placeholder="e.g., PO-12345"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Line Items</h3>
              {errors.items && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.items}
                </p>
              )}
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="border border-border rounded-lg p-4 space-y-3 relative">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded mt-0.5">
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Optional toggle */}
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, 'isOptional', !item.isOptional)}
                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                          item.isOptional
                            ? 'border-orange-300 text-orange-600 bg-orange-50 dark:bg-orange-950/20'
                            : 'border-border text-muted-foreground hover:border-primary/30'
                        }`}
                        title="Toggle optional item"
                      >
                        {item.isOptional ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                        Optional
                      </button>
                      {items.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Product name with search */}
                  <div className="relative">
                    <Input
                      value={item.name}
                      onChange={e => {
                        const val = e.target.value;
                        updateItem(item.id, 'name', val);
                        if (val.length > 0) setProductSearchOpen(item.id);
                        
                        // Auto-fill product if SKU matches exactly
                        if (val.length >= 2) {
                          const found = productsList.find(p => 
                            p.sku?.toLowerCase() === val.toLowerCase() || 
                            p.id.toLowerCase().includes(val.toLowerCase())
                          );
                          if (found) {
                            applyProduct(item.id, found);
                            toast.success(`Product "${found.name}" auto-filled`);
                          }
                        }
                      }}
                      onFocus={() => setProductSearchOpen(item.id)}
                      placeholder="Item name or Product SKU/Code"
                      className="pr-8"
                    />
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />

                    {productSearchOpen === item.id && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        <div className="p-2 border-b border-border">
                          <Input
                            placeholder="Search..."
                            value={productQuery}
                            onChange={e => setProductQuery(e.target.value)}
                            className="h-7 text-xs"
                            autoFocus
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                        {filteredProducts.length === 0 ? (
                          <p className="text-xs text-muted-foreground p-3 text-center">No products found</p>
                        ) : (
                          filteredProducts.slice(0, 8).map(p => (
                            <button
                              key={p.id}
                              type="button"
                              className="w-full flex items-start gap-2 p-2 hover:bg-muted/50 text-left"
                              onClick={() => applyProduct(item.id, p)}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(p.unitPrice, currency)} / {p.unit} · {p.taxRate}% tax
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                        <button
                          type="button"
                          className="w-full text-xs text-muted-foreground p-2 hover:bg-muted/50 border-t border-border"
                          onClick={() => { setProductSearchOpen(null); setProductQuery(''); }}
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <Input
                    value={item.description || ''}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Description (optional)"
                    className="text-sm"
                  />

                  {/* Qty / Unit / Price / Discount / Tax */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unit</Label>
                      <Select value={item.unit} onValueChange={v => updateItem(item.id, 'unit', v as UnitType)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Discount %</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={item.discountPercent}
                          onChange={e => updateItem(item.id, 'discountPercent', parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm pr-6"
                        />
                        <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Tax %</Label>
                      <Select
                        value={String(item.taxRate)}
                        onValueChange={v => updateItem(item.id, 'taxRate', parseFloat(v))}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GST_TAX_RATES.map(r => (
                            <SelectItem key={r} value={String(r)}>{r}%</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Item total */}
                  <div className="flex justify-between items-center pt-1 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      Tax: {formatCurrency(item.taxAmount, currency)}
                      {item.isOptional && (
                        <Badge className="ml-2 text-xs bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">Optional</Badge>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(item.totalAfterTax, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addItem} className="gap-2 w-full">
              <Plus className="h-4 w-4" />
              Add Line Item
            </Button>
          </div>

          {/* Notes & Terms */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Notes & Terms</h3>
            <div>
              <Label htmlFor="notes">Notes (visible to client)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional notes for the client..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={terms}
                onChange={e => setTerms(e.target.value)}
                placeholder="Quote validity, payment terms, etc."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-6">
          {/* Customer Preview */}
          {selectedCustomer && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Bill To</h3>
              <p className="font-semibold text-foreground">{selectedCustomer.name}</p>
              {selectedCustomer.companyName && (
                <p className="text-sm text-muted-foreground">{selectedCustomer.companyName}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {selectedCustomer.billingAddress?.city || ''}, {selectedCustomer.billingAddress?.state || ''}
              </p>
              <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
            </div>
          )}

          {/* Totals */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(totals.subtotal, currency)}</span>
            </div>
            {totals.discountTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-destructive">-{formatCurrency(totals.discountTotal, currency)}</span>
              </div>
            )}
            {totals.taxBreakdown?.map((tax, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tax.taxType} @ {tax.taxRate}%</span>
                <span>{formatCurrency(tax.taxAmount, currency)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(totals.grandTotal, currency)}</span>
            </div>
            {items.some(i => i.isOptional) && (
              <p className="text-xs text-muted-foreground">
                * Optional items included in total. Client may choose to exclude them.
              </p>
            )}
          </div>

          {/* Validity */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Validity</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Issue Date</span>
              <span>{issueDate ? new Date(issueDate).toLocaleDateString() : '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valid Until</span>
              <span className="font-medium">{expiryDate ? new Date(expiryDate).toLocaleDateString() : '—'}</span>
            </div>
            {issueDate && expiryDate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Validity Period</span>
                <span>
                  {Math.ceil((new Date(expiryDate).getTime() - new Date(issueDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full gap-2"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              {isEdit ? 'Update Quote' : 'Save as Draft'}
            </Button>
            {!isEdit && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => handleSave(true)}
                disabled={isSaving}
              >
                <Send className="h-4 w-4" />
                Save & Mark Sent
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
