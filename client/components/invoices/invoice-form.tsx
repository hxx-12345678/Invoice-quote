'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Document, 
  DocumentItem, 
  DocumentType, 
  Customer, 
  Product,
  TaxBreakdown,
  TaxType,
  UnitType
} from '@/lib/types';
import { 
  DocumentsStore, 
  CustomersStore, 
  ProductsStore,
  BusinessProfileStore,
  UserSettingsStore,
  CURRENCIES,
  formatCurrency,
  calculateDocumentTotals,
  calculateGSTBreakdown,
  generateId,
} from '@/lib/store';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon,
  User,
  Package,
  Search,
  X
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { ApiService } from '@/lib/api-service';
import { toast } from 'sonner';

interface InvoiceFormProps {
  document?: Document;
  documentType?: DocumentType;
  onComplete: (document: Document) => void;
  onCancel: () => void;
}

export function InvoiceForm({ 
  document, 
  documentType = 'invoice',
  onComplete, 
  onCancel 
}: InvoiceFormProps) {
  const businessProfile = BusinessProfileStore.get();
  const settings = UserSettingsStore.get();
  const customers = CustomersStore.getAll().filter(c => c.isActive);
  const products = ProductsStore.getAll().filter(p => p.isActive);
  
  const isEditing = !!document;

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState(document?.customerId || '');
  const [issueDate, setIssueDate] = useState<Date>(
    document?.issueDate ? new Date(document.issueDate) : new Date()
  );
  const [dueDate, setDueDate] = useState<Date>(
    document?.dueDate ? new Date(document.dueDate) : addDays(new Date(), 30)
  );
  const [currency, setCurrency] = useState(document?.currency || settings?.currency || 'INR');
  const [notes, setNotes] = useState(document?.notes || settings?.defaultNotes || '');
  const [terms, setTerms] = useState(document?.terms || settings?.defaultTerms || '');
  const [placeOfSupply, setPlaceOfSupply] = useState(document?.placeOfSupply || businessProfile?.state || '');
  const [validityPeriod, setValidityPeriod] = useState(document?.validityPeriod || 30);
  const [incoterms, setIncoterms] = useState(document?.incoterms || '');
  const [deliveryTerms, setDeliveryTerms] = useState(document?.deliveryTerms || '');
  const [reason, setReason] = useState(document?.reason || '');
  const [reasonCode, setReasonCode] = useState(document?.reasonCode || '');
  const [referenceNumber, setReferenceNumber] = useState(document?.referenceNumber || '');
  const [items, setItems] = useState<DocumentItem[]>(
    document?.items || []
  );
  const [isLoading, setIsLoading] = useState(false);
  
  // Memoize customers to prevent infinite re-render loops due to localStorage array refs
  const customersList = useMemo(() => CustomersStore.getAll().filter(c => c.isActive), []);
  const productsList = useMemo(() => ProductsStore.getAll().filter(p => p.isActive), []);

  // Dialog states
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: businessProfile?.country || 'India',
    },
    taxId: '',
  });

  const selectedCustomer = useMemo(
    () => customersList.find(c => c.id === selectedCustomerId),
    [customersList, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery) return customersList;
    return customersList.filter(c => 
      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(customerSearchQuery.toLowerCase()))
    );
  }, [customersList, customerSearchQuery]);

  // Determine if inter-state supply for GST
  const isInterState = useMemo(() => {
    if (settings?.taxSystem !== 'GST' || !selectedCustomer || !businessProfile) return false;
    return selectedCustomer.billingAddress?.state !== businessProfile.state;
  }, [settings?.taxSystem, selectedCustomer, businessProfile]);

  // Calculate totals
  const totals = useMemo(() => {
    return calculateDocumentTotals(items);
  }, [items]);

  // Generate tax breakdown for display
  const taxBreakdownDisplay = useMemo(() => {
    if (settings?.taxSystem !== 'GST') return totals.taxBreakdown;
    
    // Recalculate with GST split
    const breakdown: TaxBreakdown[] = [];
    items.forEach(item => {
      if (item.taxRate > 0) {
        const gstBreakdown = calculateGSTBreakdown(
          item.totalBeforeTax,
          item.taxRate,
          isInterState,
          false
        );
        gstBreakdown.forEach(tb => {
          const existing = breakdown.find(b => b.taxType === tb.taxType && b.taxRate === tb.taxRate);
          if (existing) {
            existing.taxableAmount += tb.taxableAmount;
            existing.taxAmount += tb.taxAmount;
          } else {
            breakdown.push({ ...tb });
          }
        });
      }
    });
    return breakdown;
  }, [items, isInterState, settings?.taxSystem]);

  // Add new item
  const addItem = useCallback(() => {
    const newItem: DocumentItem = {
      id: generateId(),
      name: '',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxType: isInterState ? 'IGST' : 'CGST',
      taxRate: settings?.defaultTaxRate || 18,
      taxAmount: 0,
      totalBeforeTax: 0,
      totalAfterTax: 0,
    };
    setItems(prev => [...prev, newItem]);
  }, [isInterState, settings?.defaultTaxRate]);

  // Remove item
  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Update item — recalculates all derived fields
  const updateItem = useCallback((index: number, updates: Partial<DocumentItem>) => {
    setItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index], ...updates };

      // Line total before any discount
      const baseTotal = item.quantity * item.unitPrice;

      // Percent discount takes priority over fixed discount amount
      const discountAmount = item.discountPercent > 0
        ? baseTotal * (item.discountPercent / 100)
        : (item.discountAmount || 0);

      // Clamp discount — cannot exceed line total
      const clampedDiscount = Math.min(discountAmount, baseTotal);
      item.discountAmount = clampedDiscount;

      // Pre-tax total
      item.totalBeforeTax = Math.max(0, baseTotal - clampedDiscount);

      // Tax is always computed on the pre-tax amount (exclusive model by default)
      item.taxAmount = item.totalBeforeTax * (item.taxRate / 100);
      item.totalAfterTax = item.totalBeforeTax + item.taxAmount;

      // Auto-assign tax type based on inter-state (GST only)
      if (settings?.taxSystem === 'GST') {
        item.taxType = isInterState ? 'IGST' : 'CGST';
      } else if (settings?.taxSystem === 'VAT') {
        item.taxType = 'VAT';
      } else if (settings?.taxSystem === 'SALES_TAX') {
        item.taxType = 'SALES_TAX';
      } else {
        item.taxType = 'NONE';
      }

      newItems[index] = item;
      return newItems;
    });
  }, [isInterState, settings?.taxSystem]);

  // Add product to items
  const addProductToItems = useCallback((product: Product, index?: number) => {
    const targetIndex = index !== undefined ? index : currentItemIndex;
    if (targetIndex !== null && targetIndex !== undefined) {
      updateItem(targetIndex, {
        productId: product.id,
        name: product.name,
        description: product.description,
        hsnCode: product.hsnCode,
        sacCode: product.sacCode,
        unitPrice: product.unitPrice,
        unit: product.unit,
        taxRate: product.taxRate,
      });
    } else {
      const newItem: DocumentItem = {
        id: generateId(),
        productId: product.id,
        name: product.name,
        description: product.description,
        hsnCode: product.hsnCode,
        sacCode: product.sacCode,
        quantity: 1,
        unit: product.unit,
        unitPrice: product.unitPrice,
        discountPercent: 0,
        discountAmount: 0,
        taxType: isInterState ? 'IGST' : 'CGST',
        taxRate: product.taxRate,
        taxAmount: product.unitPrice * (product.taxRate / 100),
        totalBeforeTax: product.unitPrice,
        totalAfterTax: product.unitPrice * (1 + product.taxRate / 100),
      };
      setItems(prev => [...prev, newItem]);
    }
    setProductDialogOpen(false);
    setCurrentItemIndex(null);
    setProductSearchQuery('');
  }, [currentItemIndex, isInterState, updateItem]);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!productSearchQuery) return products;
    const query = productSearchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query) ||
      p.hsnCode?.includes(query) ||
      p.sacCode?.includes(query)
    );
  }, [products, productSearchQuery]);

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
      billingAddress: {
        street: newCustomer.billingAddress?.street || '',
        city: newCustomer.billingAddress?.city || '',
        state: newCustomer.billingAddress?.state || '',
        pincode: newCustomer.billingAddress?.pincode || '',
        country: newCustomer.billingAddress?.country || '',
      },
      paymentTerms: 'due_on_receipt',
      currency: currency,
      isActive: true,
    });

    setSelectedCustomerId(created.id);
    setNewCustomerDialogOpen(false);
    setCustomerDialogOpen(false);
    setCustomerSearchQuery('');
    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      companyName: '',
      billingAddress: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: '',
      },
    });
    toast.success('Customer added successfully');
  };

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    if (!selectedCustomerId) {
      setFormError('Please select a customer');
      return;
    }
    const validItems = items.filter(i => i.name.trim());
    if (validItems.length === 0) {
      setFormError('Please add at least one line item with a name');
      return;
    }
    if (items.some(i => i.quantity <= 0)) {
      setFormError('All item quantities must be greater than 0');
      return;
    }
    if (new Date(dueDate) < new Date(issueDate)) {
      setFormError('Due date cannot be before issue date');
      return;
    }
    if (documentType === 'proforma' && (!incoterms || !deliveryTerms)) {
      setFormError('Incoterms and delivery terms are required for proforma invoices');
      return;
    }
    if (documentType === 'credit_note' && (!reason || !referenceNumber)) {
      setFormError('Reason and reference number are required for credit notes');
      return;
    }

    setIsLoading(true);

    const documentNumber = document?.documentNumber || 
      DocumentsStore.getNextNumber(documentType, settings!);

    const docData: Omit<Document, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: businessProfile?.userId || generateId(),
      businessProfileId: businessProfile?.id || generateId(),
      type: documentType,
      documentNumber,
      customerId: selectedCustomerId,
      issueDate,
      dueDate,
      currency,
      exchangeRate: 1,
      items,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      amountPaid: document?.amountPaid || 0,
      amountDue: totals.grandTotal - (document?.amountPaid || 0),
      status: document?.status || 'draft',
      taxBreakdown: taxBreakdownDisplay,
      notes: notes || undefined,
      terms: terms || undefined,
      placeOfSupply: placeOfSupply || undefined,
      validityPeriod: documentType === 'proforma' ? validityPeriod : undefined,
      incoterms: documentType === 'proforma' ? incoterms : undefined,
      deliveryTerms: documentType === 'proforma' ? deliveryTerms : undefined,
      reason: documentType === 'credit_note' ? reason : undefined,
      reasonCode: documentType === 'credit_note' ? reasonCode : undefined,
      referenceNumber: referenceNumber || undefined,
    };

    try {
      let savedDoc: Document;
      if (isEditing && document) {
        const response = await ApiService.documents.update(document.id, docData);
        savedDoc = response.data.data || response.data;
        DocumentsStore.update(document.id, savedDoc);
        toast.success(`${documentType === 'invoice' ? 'Invoice' : documentType} updated successfully`);
      } else {
        const response = await ApiService.documents.create(docData);
        savedDoc = response.data.data || response.data;
        DocumentsStore.add(savedDoc);
        toast.success(`${documentType === 'invoice' ? 'Invoice' : documentType} created successfully`);
      }
      onComplete(savedDoc);
    } catch (error) {
      console.error(`Error saving ${documentType}:`, error);
      toast.error(`Failed to save ${documentType}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Set due date based on payment terms when customer changes
  useEffect(() => {
    if (selectedCustomer && !isEditing) {
      const termsDays = {
        'due_on_receipt': 0,
        'net_7': 7,
        'net_15': 15,
        'net_30': 30,
        'net_45': 45,
        'net_60': 60,
        'custom': 30,
      };
      const days = termsDays[selectedCustomer.paymentTerms] || 30;
      setDueDate(addDays(issueDate, days));
      setCurrency(selectedCustomer.currency);
    }
  }, [selectedCustomer, issueDate, isEditing]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {isEditing ? `Edit ${documentType}` : `New ${documentType === 'invoice' ? 'Invoice' : documentType}`}
          </h2>
          <p className="text-muted-foreground">
            {isEditing ? 'Update document details' : 'Create a new document'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-3"
                  >
                    {selectedCustomer ? (
                      <div className="text-left">
                        <div className="font-medium">{selectedCustomer.name}</div>
                        {selectedCustomer.companyName && (
                          <div className="text-sm text-muted-foreground">{selectedCustomer.companyName}</div>
                        )}
                        <div className="text-sm text-muted-foreground">{selectedCustomer.email}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select a customer...</span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select Customer</DialogTitle>
                    <DialogDescription>Choose a customer for this invoice or create one quickly.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search customers by name, email or company..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {filteredCustomers.map(customer => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            setSelectedCustomerId(customer.id);
                            setCustomerDialogOpen(false);
                          }}
                          className={cn(
                            "w-full p-3 rounded-lg border text-left transition-colors hover:bg-muted",
                            selectedCustomerId === customer.id && "border-primary bg-primary/5"
                          )}
                        >
                          <div className="font-medium">{customer.name}</div>
                          {customer.companyName && (
                            <div className="text-sm text-muted-foreground">{customer.companyName}</div>
                          )}
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                        </button>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          No customers found. Use the button below to add one.
                        </p>
                      )}
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => setNewCustomerDialogOpen(true)}>
                      Add New Customer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={newCustomerDialogOpen} onOpenChange={setNewCustomerDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>Enter basic customer details for this invoice.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Name"
                      value={newCustomer.name || ''}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={newCustomer.email || ''}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Input
                      placeholder="Phone"
                      value={newCustomer.phone || ''}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    />
                    <Input
                      placeholder="Company"
                      value={newCustomer.companyName || ''}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        placeholder="City"
                        value={newCustomer.billingAddress?.city || ''}
                        onChange={(e) => setNewCustomer(prev => ({
                          ...prev,
                          billingAddress: { 
                            street: prev.billingAddress?.street || '',
                            state: prev.billingAddress?.state || '',
                            pincode: prev.billingAddress?.pincode || '',
                            country: prev.billingAddress?.country || '',
                            city: e.target.value 
                          },
                        }))}
                      />
                      <Input
                        placeholder="State"
                        value={newCustomer.billingAddress?.state || ''}
                        onChange={(e) => setNewCustomer(prev => ({
                          ...prev,
                          billingAddress: { 
                            street: prev.billingAddress?.street || '',
                            city: prev.billingAddress?.city || '',
                            pincode: prev.billingAddress?.pincode || '',
                            country: prev.billingAddress?.country || '',
                            state: e.target.value 
                          },
                        }))}
                      />
                      <Input
                        placeholder="Pincode"
                        value={newCustomer.billingAddress?.pincode || ''}
                        onChange={(e) => setNewCustomer(prev => ({
                          ...prev,
                          billingAddress: { 
                            street: prev.billingAddress?.street || '',
                            city: prev.billingAddress?.city || '',
                            state: prev.billingAddress?.state || '',
                            country: prev.billingAddress?.country || '',
                            pincode: e.target.value 
                          },
                        }))}
                      />
                      <Input
                        placeholder="Country"
                        value={newCustomer.billingAddress?.country || ''}
                        onChange={(e) => setNewCustomer(prev => ({
                          ...prev,
                          billingAddress: { 
                            street: prev.billingAddress?.street || '',
                            city: prev.billingAddress?.city || '',
                            state: prev.billingAddress?.state || '',
                            pincode: prev.billingAddress?.pincode || '',
                            country: e.target.value 
                          },
                        }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveNewCustomer}>Save Customer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {selectedCustomer && settings?.taxSystem === 'GST' && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Place of Supply:</span>
                    <span className="font-medium">{selectedCustomer.billingAddress?.state}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground">Tax Type:</span>
                    <span className="font-medium">{isInterState ? 'IGST' : 'CGST + SGST'}</span>
                  </div>
                  {selectedCustomer.taxId && (
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">Customer GSTIN:</span>
                      <span className="font-medium">{selectedCustomer.taxId}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates & Currency */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {format(issueDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={issueDate}
                        onSelect={(date) => date && setIssueDate(date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {format(dueDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={(date) => date && setDueDate(date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proforma Specific Fields */}
          {documentType === 'proforma' && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Proforma Details</CardTitle>
                <CardDescription>Additional information for proforma invoice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Validity Period (Days)</Label>
                    <Input
                      type="number"
                      value={validityPeriod}
                      onChange={(e) => setValidityPeriod(Number(e.target.value))}
                      min="1"
                      max="365"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Incoterms</Label>
                    <Select value={incoterms} onValueChange={setIncoterms}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Incoterms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                        <SelectItem value="FCA">FCA - Free Carrier</SelectItem>
                        <SelectItem value="FAS">FAS - Free Alongside Ship</SelectItem>
                        <SelectItem value="FOB">FOB - Free On Board</SelectItem>
                        <SelectItem value="CFR">CFR - Cost and Freight</SelectItem>
                        <SelectItem value="CIF">CIF - Cost, Insurance and Freight</SelectItem>
                        <SelectItem value="CPT">CPT - Carriage Paid To</SelectItem>
                        <SelectItem value="CIP">CIP - Carriage and Insurance Paid To</SelectItem>
                        <SelectItem value="DAP">DAP - Delivered At Place</SelectItem>
                        <SelectItem value="DPU">DPU - Delivered At Place Unloaded</SelectItem>
                        <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery Terms</Label>
                    <Input
                      value={deliveryTerms}
                      onChange={(e) => setDeliveryTerms(e.target.value)}
                      placeholder="e.g., Delivered within 7 days"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credit Note Specific Fields */}
          {documentType === 'credit_note' && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Credit Note Details</CardTitle>
                <CardDescription>Reason and reference for the credit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Reason for Credit</Label>
                    <Select value={reasonCode} onValueChange={(value) => {
                      setReasonCode(value);
                      const reasons = {
                        'RETURN': 'Return of goods',
                        'DISCOUNT': 'Additional discount',
                        'ERROR': 'Invoice error correction',
                        'DAMAGE': 'Damaged goods',
                        'CANCEL': 'Order cancellation'
                      };
                      setReason(reasons[value as keyof typeof reasons] || '');
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RETURN">Return of goods</SelectItem>
                        <SelectItem value="DISCOUNT">Additional discount</SelectItem>
                        <SelectItem value="ERROR">Invoice error correction</SelectItem>
                        <SelectItem value="DAMAGE">Damaged goods</SelectItem>
                        <SelectItem value="CANCEL">Order cancellation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference Invoice Number</Label>
                    <Input
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Original invoice number"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label>Detailed Reason</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide detailed explanation for the credit"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Line Items */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Items
                </CardTitle>
                <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="gap-2"
                      onClick={() => setCurrentItemIndex(null)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add Item</DialogTitle>
                      <DialogDescription>Select from your products or add a custom item</DialogDescription>
                    </DialogHeader>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {filteredProducts.map(product => (
                        <button
                          key={product.id}
                          onClick={() => addProductToItems(product)}
                          className="w-full p-3 rounded-lg border text-left transition-colors hover:bg-muted flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.hsnCode && `HSN: ${product.hsnCode} | `}
                              {product.sacCode && `SAC: ${product.sacCode} | `}
                              Tax: {product.taxRate}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(product.unitPrice, currency)}</div>
                            <div className="text-sm text-muted-foreground">per {product.unit}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4" onClick={() => {
                      addItem();
                      setProductDialogOpen(false);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Item
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No items added yet. Click &quot;Add Item&quot; to start.
                </div>
              ) : (
                items.map((item, index) => (
                  <div key={item.id} className="p-4 border border-border rounded-lg space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <Label>Item Name</Label>
                        <Input
                          placeholder="Item name or Product SKU/Code"
                          value={item.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateItem(index, { name: val });
                            // Auto-fill product if SKU matches exactly
                            if (val.length >= 2) {
                              const found = products.find(p => 
                                p.sku?.toLowerCase() === val.toLowerCase() || 
                                p.id.toLowerCase().includes(val.toLowerCase())
                              );
                              if (found) {
                                addProductToItems(found, index);
                                toast.success(`Product "${found.name}" auto-filled`);
                              }
                            }
                          }}
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Select 
                          value={item.unit} 
                          onValueChange={(value) => updateItem(index, { unit: value as UnitType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pcs">Pieces</SelectItem>
                            <SelectItem value="hrs">Hours</SelectItem>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="nos">Numbers</SelectItem>
                            <SelectItem value="kg">Kilograms</SelectItem>
                            <SelectItem value="unit">Units</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tax Rate (%)</Label>
                        <Select 
                          value={item.taxRate.toString()} 
                          onValueChange={(value) => updateItem(index, { taxRate: parseFloat(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="12">12%</SelectItem>
                            <SelectItem value="18">18%</SelectItem>
                            <SelectItem value="28">28%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {settings?.taxSystem === 'GST' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>HSN Code</Label>
                          <Input
                            placeholder="HSN Code"
                            value={item.hsnCode || ''}
                            onChange={(e) => updateItem(index, { hsnCode: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>SAC Code</Label>
                          <Input
                            placeholder="SAC Code"
                            value={item.sacCode || ''}
                            onChange={(e) => updateItem(index, { sacCode: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        Subtotal: {formatCurrency(item.totalBeforeTax, currency)}
                      </span>
                      <span className="font-medium">
                        Total: {formatCurrency(item.totalAfterTax, currency)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Notes & Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes for the customer..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea
                  placeholder="Payment terms, return policy, etc..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totals.subtotal, currency)}</span>
                </div>
                {totals.discountTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-destructive">-{formatCurrency(totals.discountTotal, currency)}</span>
                  </div>
                )}
              </div>

              {/* Tax Breakdown */}
              {taxBreakdownDisplay?.length > 0 && (
                <div className="pt-2 border-t border-border space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Tax Breakdown</div>
                  {taxBreakdownDisplay?.map((tax, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {tax.taxType} @ {tax.taxRate}%
                      </span>
                      <span>{formatCurrency(tax.taxAmount, currency)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-border">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(totals.grandTotal, currency)}</span>
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <X className="h-4 w-4 flex-shrink-0" />
                  {formError}
                </div>
              )}
              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={handleSubmit}
                disabled={isLoading || !selectedCustomerId || items.length === 0}
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'} {documentType === 'invoice' ? 'Invoice' : 'Document'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
