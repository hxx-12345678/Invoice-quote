'use client';

import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Customer, PaymentTerms } from '@/lib/types';
import { 
  CustomersStore, 
  BusinessProfileStore,
  UserSettingsStore,
  COUNTRY_TAX_CONFIGS, 
  CURRENCIES,
  generateId 
} from '@/lib/store';
import { ArrowLeft, Save, User } from 'lucide-react';
import { ApiService } from '@/lib/api-service';
import { toast } from 'sonner';

interface CustomerFormProps {
  customer?: Customer;
  onComplete: (customer: Customer) => void;
  onCancel: () => void;
}

const PAYMENT_TERMS_OPTIONS: { value: PaymentTerms; label: string }[] = [
  { value: 'due_on_receipt', label: 'Due on Receipt' },
  { value: 'net_7', label: 'Net 7 Days' },
  { value: 'net_15', label: 'Net 15 Days' },
  { value: 'net_30', label: 'Net 30 Days' },
  { value: 'net_45', label: 'Net 45 Days' },
  { value: 'net_60', label: 'Net 60 Days' },
];

export function CustomerForm({ customer, onComplete, onCancel }: CustomerFormProps) {
  const businessProfile = BusinessProfileStore.get();
  const isEditing = !!customer;

  const settings = UserSettingsStore.get();

  const [formData, setFormData] = useState({
    name: customer?.name || '',
    companyName: customer?.companyName || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    taxId: customer?.taxId || '',
    paymentTerms: customer?.paymentTerms || 'net_30',
    currency: customer?.currency || settings?.currency || (businessProfile?.country === 'India' ? 'INR' : 'USD'),
    creditLimit: customer?.creditLimit?.toString() || '',
    notes: customer?.notes || '',
    isActive: customer?.isActive ?? true,
    // Billing Address
    billingStreet: customer?.billingAddress?.street || '',
    billingCity: customer?.billingAddress?.city || '',
    billingState: customer?.billingAddress?.state || '',
    billingCountry: customer?.billingAddress?.country || businessProfile?.country || 'India',
    billingPincode: customer?.billingAddress?.pincode || '',
    // Shipping Address
    useShippingAddress: !!customer?.shippingAddress,
    shippingStreet: customer?.shippingAddress?.street || '',
    shippingCity: customer?.shippingAddress?.city || '',
    shippingState: customer?.shippingAddress?.state || '',
    shippingCountry: customer?.shippingAddress?.country || '',
    shippingPincode: customer?.shippingAddress?.pincode || '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const selectedCountry = COUNTRY_TAX_CONFIGS.find(c => c.country === formData.billingCountry);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalSpent' | 'totalOutstanding'> = {
      userId: businessProfile?.userId || generateId(),
      businessProfileId: businessProfile?.id || generateId(),
      name: formData.name,
      companyName: formData.companyName || undefined,
      email: formData.email,
      phone: formData.phone || undefined,
      taxId: formData.taxId || undefined,
      paymentTerms: formData.paymentTerms as PaymentTerms,
      currency: formData.currency,
      creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
      notes: formData.notes || undefined,
      isActive: formData.isActive,
      billingAddress: {
        street: formData.billingStreet,
        city: formData.billingCity,
        state: formData.billingState,
        country: formData.billingCountry,
        pincode: formData.billingPincode,
      },
      shippingAddress: formData.useShippingAddress ? {
        street: formData.shippingStreet,
        city: formData.shippingCity,
        state: formData.shippingState,
        country: formData.shippingCountry,
        pincode: formData.shippingPincode,
      } : undefined,
    };

    try {
      let savedCustomer: Customer;
      if (isEditing && customer) {
        // Update via API
        const response = await ApiService.customers.update(customer.id, customerData);
        savedCustomer = response.data.data || response.data;
        // Also update local store
        CustomersStore.update(customer.id, savedCustomer);
        toast.success('Customer updated successfully');
      } else {
        // Create via API
        const response = await ApiService.customers.create(customerData);
        savedCustomer = response.data.data || response.data;
        // Also add to local store
        CustomersStore.add(savedCustomer);
        toast.success('Customer created successfully');
      }
      onComplete(savedCustomer);
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <p className="text-muted-foreground">
            {isEditing ? 'Update customer information' : 'Add a new customer to your database'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Customer contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Acme Inc"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxId">
                  {selectedCountry?.taxIdLabel || 'Tax ID'} (Customer&apos;s)
                </Label>
                <Input
                  id="taxId"
                  placeholder={`Customer's ${selectedCountry?.taxIdLabel || 'Tax ID'}`}
                  value={formData.taxId}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Billing Address</CardTitle>
            <CardDescription>Customer billing location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="billingStreet">Street Address *</Label>
              <Textarea
                id="billingStreet"
                placeholder="123 Main Street"
                value={formData.billingStreet}
                onChange={(e) => handleChange('billingStreet', e.target.value)}
                required
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingCountry">Country *</Label>
                <Select
                  value={formData.billingCountry}
                  onValueChange={(value) => handleChange('billingCountry', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_TAX_CONFIGS.map((config) => (
                      <SelectItem key={config.country} value={config.country}>
                        {config.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCountry?.states && (
                <div className="space-y-2">
                  <Label htmlFor="billingState">State/Province *</Label>
                  <Select
                    value={formData.billingState}
                    onValueChange={(value) => handleChange('billingState', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCountry.states.map((state) => (
                        <SelectItem key={state.code} value={state.name}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingCity">City *</Label>
                <Input
                  id="billingCity"
                  placeholder="City name"
                  value={formData.billingCity}
                  onChange={(e) => handleChange('billingCity', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingPincode">PIN/ZIP Code *</Label>
                <Input
                  id="billingPincode"
                  placeholder="Postal code"
                  value={formData.billingPincode}
                  onChange={(e) => handleChange('billingPincode', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Shipping Address</CardTitle>
                <CardDescription>Different from billing address?</CardDescription>
              </div>
              <Switch
                checked={formData.useShippingAddress}
                onCheckedChange={(checked) => handleChange('useShippingAddress', checked)}
              />
            </div>
          </CardHeader>
          {formData.useShippingAddress && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shippingStreet">Street Address</Label>
                <Textarea
                  id="shippingStreet"
                  placeholder="123 Shipping Lane"
                  value={formData.shippingStreet}
                  onChange={(e) => handleChange('shippingStreet', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingCity">City</Label>
                  <Input
                    id="shippingCity"
                    placeholder="City name"
                    value={formData.shippingCity}
                    onChange={(e) => handleChange('shippingCity', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingState">State</Label>
                  <Input
                    id="shippingState"
                    placeholder="State/Province"
                    value={formData.shippingState}
                    onChange={(e) => handleChange('shippingState', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingCountry">Country</Label>
                  <Input
                    id="shippingCountry"
                    placeholder="Country"
                    value={formData.shippingCountry}
                    onChange={(e) => handleChange('shippingCountry', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingPincode">PIN/ZIP Code</Label>
                  <Input
                    id="shippingPincode"
                    placeholder="Postal code"
                    value={formData.shippingPincode}
                    onChange={(e) => handleChange('shippingPincode', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Payment & Other Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Settings</CardTitle>
            <CardDescription>Default payment terms for this customer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select
                  value={formData.paymentTerms}
                  onValueChange={(value) => handleChange('paymentTerms', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS_OPTIONS.map((term) => (
                      <SelectItem key={term.value} value={term.value}>
                        {term.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  placeholder="0.00"
                  value={formData.creditLimit}
                  onChange={(e) => handleChange('creditLimit', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about this customer..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Active Customer</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive customers won&apos;t appear in dropdowns
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => handleChange('isActive', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : isEditing ? 'Update Customer' : 'Add Customer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
