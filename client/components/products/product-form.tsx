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
import { Product, UnitType, TaxType } from '@/lib/types';
import { 
  ProductsStore, 
  BusinessProfileStore,
  UserSettingsStore,
  COMMON_HSN_CODES,
  COMMON_SAC_CODES,
  GST_TAX_RATES,
  generateId 
} from '@/lib/store';
import { ArrowLeft, Save, Package, Briefcase, Info } from 'lucide-react';
import { ApiService } from '@/lib/api-service';
import { toast } from 'sonner';

interface ProductFormProps {
  product?: Product;
  onComplete: (product: Product) => void;
  onCancel: () => void;
}

const UNIT_OPTIONS: { value: UnitType; label: string }[] = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'nos', label: 'Numbers' },
  { value: 'unit', label: 'Units' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'g', label: 'Grams' },
  { value: 'ltr', label: 'Liters' },
  { value: 'ml', label: 'Milliliters' },
  { value: 'hrs', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'sqft', label: 'Square Feet' },
  { value: 'sqm', label: 'Square Meters' },
  { value: 'box', label: 'Box' },
];

export function ProductForm({ product, onComplete, onCancel }: ProductFormProps) {
  const businessProfile = BusinessProfileStore.get();
  const settings = UserSettingsStore.get();
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    hsnCode: product?.hsnCode || '',
    sacCode: product?.sacCode || '',
    barcode: product?.barcode || '',
    unitPrice: product?.unitPrice?.toString() || '',
    unit: product?.unit || 'pcs',
    taxRate: product?.taxRate?.toString() || settings?.defaultTaxRate?.toString() || '18',
    taxType: product?.taxType || 'CGST',
    category: product?.category || '',
    isService: product?.isService ?? false,
    isActive: product?.isActive ?? true,
    stockQuantity: product?.stockQuantity?.toString() || '',
    lowStockThreshold: product?.lowStockThreshold?.toString() || '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleHsnSelect = (code: string) => {
    const hsnData = COMMON_HSN_CODES.find(h => h.code === code);
    if (hsnData) {
      setFormData(prev => ({
        ...prev,
        hsnCode: code,
        taxRate: hsnData.rate.toString(),
      }));
    }
  };

  const handleSacSelect = (code: string) => {
    const sacData = COMMON_SAC_CODES.find(s => s.code === code);
    if (sacData) {
      setFormData(prev => ({
        ...prev,
        sacCode: code,
        taxRate: sacData.rate.toString(),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: businessProfile?.userId || generateId(),
      businessProfileId: businessProfile?.id || generateId(),
      name: formData.name,
      description: formData.description || undefined,
      sku: formData.sku || undefined,
      hsnCode: formData.hsnCode || undefined,
      sacCode: formData.sacCode || undefined,
      barcode: formData.barcode || undefined,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      unit: formData.unit as UnitType,
      taxRate: parseFloat(formData.taxRate) || 0,
      taxType: formData.taxType as TaxType,
      category: formData.category || undefined,
      isService: formData.isService,
      isActive: formData.isActive,
      stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : undefined,
      lowStockThreshold: formData.lowStockThreshold ? parseInt(formData.lowStockThreshold) : undefined,
    };

    try {
      let savedProduct: Product;
      if (isEditing && product) {
        // Update via API
        const response = await ApiService.products.update(product.id, productData);
        savedProduct = response.data.data;
        // Also update local store
        ProductsStore.update(product.id, savedProduct);
        toast.success('Product updated successfully');
      } else {
        // Create via API
        const response = await ApiService.products.create(productData);
        savedProduct = response.data.data;
        // Also add to local store
        ProductsStore.add(savedProduct);
        toast.success('Product created successfully');
      }
      onComplete(savedProduct);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product. Please try again.');
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
            {isEditing ? 'Edit Item' : 'Add New Item'}
          </h2>
          <p className="text-muted-foreground">
            {isEditing ? 'Update product or service details' : 'Add a new product or service to your catalog'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Item Type Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Item Type</CardTitle>
            <CardDescription>Is this a product or a service?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleChange('isService', false)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  !formData.isService
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Package className={`h-8 w-8 mx-auto mb-2 ${!formData.isService ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="font-medium">Product</div>
                <div className="text-sm text-muted-foreground">Physical goods with inventory</div>
              </button>
              <button
                type="button"
                onClick={() => handleChange('isService', true)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  formData.isService
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Briefcase className={`h-8 w-8 mx-auto mb-2 ${formData.isService ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="font-medium">Service</div>
                <div className="text-sm text-muted-foreground">Professional services billed</div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
            <CardDescription>Item name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Web Development Service"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Development, Electronics"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the item..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Tax */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pricing & Tax</CardTitle>
            <CardDescription>Set pricing and applicable taxes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.unitPrice}
                  onChange={(e) => handleChange('unitPrice', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => handleChange('unit', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Select
                  value={formData.taxRate}
                  onValueChange={(value) => handleChange('taxRate', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GST_TAX_RATES.map((rate) => (
                      <SelectItem key={rate} value={rate.toString()}>
                        {rate}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Codes & Identifiers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Codes & Identifiers</CardTitle>
            <CardDescription>
              {settings?.taxSystem === 'GST' 
                ? 'HSN code for products, SAC code for services (required for GST compliance)'
                : 'Product codes and identifiers'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings?.taxSystem === 'GST' && (
              <div className="p-3 bg-muted/50 rounded-lg flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  {formData.isService 
                    ? 'Services require SAC (Services Accounting Code) for GST compliance.'
                    : 'Products require HSN (Harmonized System of Nomenclature) code for GST compliance.'
                  }
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                <Input
                  id="sku"
                  placeholder="e.g., WEB-DEV-001"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  placeholder="Barcode number"
                  value={formData.barcode}
                  onChange={(e) => handleChange('barcode', e.target.value)}
                />
              </div>
            </div>

            {/* HSN Code Selection */}
            {!formData.isService && settings?.taxSystem === 'GST' && (
              <div className="space-y-2">
                <Label htmlFor="hsnCode">HSN Code</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="hsnCode"
                    placeholder="Enter HSN code"
                    value={formData.hsnCode}
                    onChange={(e) => handleChange('hsnCode', e.target.value)}
                  />
                  <Select onValueChange={handleHsnSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select common HSN" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_HSN_CODES.map((hsn) => (
                        <SelectItem key={hsn.code} value={hsn.code}>
                          {hsn.code} - {hsn.description} ({hsn.rate}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* SAC Code Selection */}
            {formData.isService && settings?.taxSystem === 'GST' && (
              <div className="space-y-2">
                <Label htmlFor="sacCode">SAC Code</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="sacCode"
                    placeholder="Enter SAC code"
                    value={formData.sacCode}
                    onChange={(e) => handleChange('sacCode', e.target.value)}
                  />
                  <Select onValueChange={handleSacSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select common SAC" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_SAC_CODES.map((sac) => (
                        <SelectItem key={sac.code} value={sac.code}>
                          {sac.code} - {sac.description} ({sac.rate}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory (Products only) */}
        {!formData.isService && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inventory</CardTitle>
              <CardDescription>Track stock levels for this product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Current Stock</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    placeholder="0"
                    value={formData.stockQuantity}
                    onChange={(e) => handleChange('stockQuantity', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    placeholder="10"
                    value={formData.lowStockThreshold}
                    onChange={(e) => handleChange('lowStockThreshold', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Active Item</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive items won&apos;t appear when creating invoices
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
            {isLoading ? 'Saving...' : isEditing ? 'Update Item' : 'Add Item'}
          </Button>
        </div>
      </form>
    </div>
  );
}
