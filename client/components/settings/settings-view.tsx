'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  BusinessProfile,
  UserSettings,
  InvoiceTemplate,
  QuoteTemplate,
  TemplateSettings,
  BankDetails,
} from '@/lib/types';
import {
  BusinessProfileStore,
  UserSettingsStore,
  TemplateStore,
  COUNTRY_TAX_CONFIGS,
  CURRENCIES,
  GST_TAX_RATES,
} from '@/lib/store';
import {
  Save,
  Building2,
  Settings,
  Palette,
  Globe,
  Landmark,
  RefreshCw,
  ShieldCheck,
  Download,
  Trash2,
  Upload,
} from 'lucide-react';
import { ApiService } from '@/lib/api-service';
import { toast } from 'sonner';

interface SettingsViewProps {
  onProfileUpdated?: () => void;
}

export function SettingsView({ onProfileUpdated }: SettingsViewProps) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [templates, setTemplates] = useState<TemplateSettings | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'invoice' | 'quote'>('invoice');
  const [saved, setSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setProfile(BusinessProfileStore.get());
    setSettings(UserSettingsStore.get());
    setTemplates(TemplateStore.get());
  }, []);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const response = await ApiService.auth.exportData();
      const data = response.data;
      
      // Create a blob and download it
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quotiq-data-export-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Data exported successfully. Your data has been downloaded as a JSON file.');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data. Please try again later.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone. All your data, including invoices, customers, and products, will be permanently erased.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await ApiService.auth.deleteAccount();
      toast.success('Account deleted successfully.');
      
      // Clear local storage and redirect to landing
      localStorage.clear();
      window.location.href = '/';
    } catch (error) {
      console.error('Deletion failed:', error);
      toast.error('Failed to delete account. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveProfile = async () => {
    if (profile) {
      try {
        // Prepare data for API: Zod doesn't like nulls for optional fields, prefers undefined
        // Also handle BankDetails | BankDetails[] union for the backend which expects an object
        const apiData = {
          ...profile,
          businessType: profile.businessType || 'enterprise',
          legalName: profile.legalName || profile.businessName,
          bankDetails: Array.isArray(profile.bankDetails) 
            ? profile.bankDetails[0] 
            : profile.bankDetails
        };

        // Clean null values to undefined
        Object.keys(apiData).forEach(key => {
          if ((apiData as any)[key] === null) {
            delete (apiData as any)[key];
          }
        });

        await ApiService.business.update(apiData);
        BusinessProfileStore.set({ ...profile, updatedAt: new Date() });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        toast.success('Business profile updated successfully');
        onProfileUpdated?.();
      } catch (error) {
        console.error('Save profile error:', error);
        toast.error('Failed to update business profile');
      }
    }
  };

  const handleSaveSettings = async () => {
    if (settings) {
      try {
        // Prepare data for API: Clean null values to undefined
        const apiData = { ...settings };
        Object.keys(apiData).forEach(key => {
          if ((apiData as any)[key] === null) {
            delete (apiData as any)[key];
          }
        });

        await ApiService.settings.update(apiData);
        UserSettingsStore.set({ ...settings, updatedAt: new Date() });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        toast.success('Settings updated successfully');
      } catch (error) {
        console.error('Save settings error:', error);
        toast.error('Failed to update settings');
      }
    }
  };

  const handleSaveTemplate = () => {
    if (templates) {
      TemplateStore.set(templates);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const updateTemplate = (field: string, value: unknown) => {
    setTemplates(prev => {
      if (!prev) return null;
      const templateToUpdate = selectedTemplate === 'invoice' ? prev.invoiceTemplate : prev.quoteTemplate;
      const updatedTemplate = { ...templateToUpdate, [field]: value } as InvoiceTemplate | QuoteTemplate;
      return {
        ...prev,
        [selectedTemplate === 'invoice' ? 'invoiceTemplate' : 'quoteTemplate']: updatedTemplate,
      };
    });
  };

  const updateProfile = (field: string, value: string) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  const updateBankDetails = (field: string, value: string) => {
    setProfile(prev => {
      if (!prev) return null;
      // Handle BankDetails | BankDetails[] union
      const currentBank = (Array.isArray(prev.bankDetails) ? prev.bankDetails[0] : prev.bankDetails) || {} as BankDetails;
      const updatedBank = {
        ...currentBank,
        [field]: value,
      } as BankDetails;

      return {
        ...prev,
        bankDetails: updatedBank,
      };
    });
  };

  const updateSettings = (field: string, value: unknown) => {
    setSettings(prev => prev ? { ...prev, [field]: value } : null);
  };

  const currentTemplate = templates ? (selectedTemplate === 'invoice' ? templates.invoiceTemplate : templates.quoteTemplate) : null;
  const selectedCountry = COUNTRY_TAX_CONFIGS.find(c => c.country === profile?.country);

  if (!profile || !settings || !templates) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Settings</h2>
          <p className="text-muted-foreground">Manage your business profile and preferences</p>
        </div>
        {saved && (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Saved successfully
          </Badge>
        )}
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:flex-row gap-1">
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <Settings className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="bank" className="gap-2">
            <Landmark className="h-4 w-4" />
            Bank
          </TabsTrigger>
          <TabsTrigger value="template" className="gap-2">
            <Palette className="h-4 w-4" />
            Template
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Business Profile Tab */}
        <TabsContent value="business" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Business Information</CardTitle>
              <CardDescription>
                Update your business name, contact, and tax details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logoUpload">Business Logo</Label>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('logoInput')?.click()}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Logo
                        </Button>
                        <input
                          id="logoInput"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 1024 * 1024) {
                                toast.error('Logo file size should be less than 1MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                updateProfile('logoUrl', reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {profile.logoUrl && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => updateProfile('logoUrl', '')}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This logo will appear on your invoices and quotes. Recommended size: 200x200px. Max 1MB.
                      </p>
                    </div>
                  </div>
                </div>
                {profile.logoUrl && (
                  <div className="w-24 h-24 border border-border rounded-lg overflow-hidden flex items-center justify-center bg-white shrink-0 shadow-sm">
                    <img
                      src={profile.logoUrl}
                      alt="Logo Preview"
                      className="max-w-full max-h-full object-contain p-1"
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={profile.businessName}
                    onChange={(e) => updateProfile('businessName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Name</Label>
                  <Input
                    id="legalName"
                    value={profile.legalName}
                    onChange={(e) => updateProfile('legalName', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateProfile('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => updateProfile('phone', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website || ''}
                    onChange={(e) => updateProfile('website', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regNumber">Registration Number</Label>
                  <Input
                    id="regNumber"
                    value={profile.registrationNumber || ''}
                    onChange={(e) => updateProfile('registrationNumber', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId">
                    {selectedCountry?.taxIdLabel || 'Tax ID'} (GSTIN / VAT / EIN)
                  </Label>
                  <Input
                    id="taxId"
                    value={profile.taxId || ''}
                    onChange={(e) => updateProfile('taxId', e.target.value.toUpperCase())}
                    placeholder={`Enter ${selectedCountry?.taxIdLabel || 'Tax ID'}`}
                  />
                </div>
                {profile.country === 'India' && (
                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN Number</Label>
                    <Input
                      id="panNumber"
                      value={profile.panNumber || ''}
                      onChange={(e) => updateProfile('panNumber', e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={profile.address}
                  onChange={(e) => updateProfile('address', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => updateProfile('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profile.state}
                    onChange={(e) => updateProfile('state', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">PIN/ZIP</Label>
                  <Input
                    id="pincode"
                    value={profile.pincode}
                    onChange={(e) => updateProfile('pincode', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={profile.country}
                    onValueChange={(value) => updateProfile('country', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_TAX_CONFIGS.map((c) => (
                        <SelectItem key={c.country} value={c.country}>
                          {c.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveProfile} className="gap-2">
                <Save className="h-4 w-4" />
                Save Business Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Invoice Settings</CardTitle>
              <CardDescription>Configure numbering, tax, currency, and defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) => updateSettings('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxSystem">Tax System</Label>
                  <Select
                    value={settings.taxSystem}
                    onValueChange={(value) => updateSettings('taxSystem', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GST">GST (India)</SelectItem>
                      <SelectItem value="VAT">VAT (EU/UK)</SelectItem>
                      <SelectItem value="SALES_TAX">Sales Tax (US)</SelectItem>
                      <SelectItem value="NONE">No Tax</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                  <Select
                    value={settings.defaultTaxRate.toString()}
                    onValueChange={(value) => updateSettings('defaultTaxRate', parseFloat(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(settings.taxSystem === 'GST'
                        ? GST_TAX_RATES
                        : [0, 5, 8, 10, 12, 15, 18, 20, 21, 23, 25, 28]
                      ).map((rate) => (
                        <SelectItem key={rate} value={rate.toString()}>
                          {rate}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Tax Inclusive Pricing</p>
                  <p className="text-xs text-muted-foreground">
                    Prices entered already include tax
                  </p>
                </div>
                <Switch
                  checked={settings.taxInclusive}
                  onCheckedChange={(checked) => updateSettings('taxInclusive', checked)}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                  <div className="flex gap-2">
                    <Input
                      id="invoicePrefix"
                      value={settings.invoicePrefix}
                      onChange={(e) => updateSettings('invoicePrefix', e.target.value)}
                      placeholder="INV"
                      className="w-28"
                    />
                    <div className="flex-1 flex items-center px-3 bg-muted rounded-md text-sm text-muted-foreground">
                      Preview: {settings.invoicePrefix}-2026-0001
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceStart">Starting Number</Label>
                  <Input
                    id="invoiceStart"
                    type="number"
                    min="1"
                    value={settings.invoiceStartNumber}
                    onChange={(e) => updateSettings('invoiceStartNumber', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quotePrefix">Quote Prefix</Label>
                  <Input
                    id="quotePrefix"
                    value={settings.quotePrefix}
                    onChange={(e) => updateSettings('quotePrefix', e.target.value)}
                    placeholder="QT"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Default Payment Terms</Label>
                  <Select
                    value={settings.defaultPaymentTerms}
                    onValueChange={(value) => updateSettings('defaultPaymentTerms', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                      <SelectItem value="net_7">Net 7 Days</SelectItem>
                      <SelectItem value="net_15">Net 15 Days</SelectItem>
                      <SelectItem value="net_30">Net 30 Days</SelectItem>
                      <SelectItem value="net_45">Net 45 Days</SelectItem>
                      <SelectItem value="net_60">Net 60 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value) => updateSettings('dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/01/2026)</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (01/31/2026)</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2026-01-31)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => updateSettings('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Singapore">Asia/Singapore (SGT)</SelectItem>
                      <SelectItem value="Australia/Sydney">Australia/Sydney (AEST)</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="defaultNotes">Default Notes</Label>
                <Textarea
                  id="defaultNotes"
                  value={settings.defaultNotes || ''}
                  onChange={(e) => updateSettings('defaultNotes', e.target.value)}
                  placeholder="Default notes to appear on invoices..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultTerms">Default Terms & Conditions</Label>
                <Textarea
                  id="defaultTerms"
                  value={settings.defaultTerms || ''}
                  onChange={(e) => updateSettings('defaultTerms', e.target.value)}
                  placeholder="Default payment terms and conditions..."
                  rows={3}
                />
              </div>

              <Button onClick={handleSaveSettings} className="gap-2">
                <Save className="h-4 w-4" />
                Save Billing Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Details Tab */}
        <TabsContent value="bank" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Bank Details</CardTitle>
              <CardDescription>
                These details will be displayed on your invoices for payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={(Array.isArray(profile.bankDetails) ? profile.bankDetails[0] : profile.bankDetails)?.bankName || ''}
                    onChange={(e) => updateBankDetails('bankName', e.target.value)}
                    placeholder="e.g. HDFC Bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountHolder">Account Holder Name</Label>
                  <Input
                    id="accountHolder"
                    value={(Array.isArray(profile.bankDetails) ? profile.bankDetails[0] : profile.bankDetails)?.accountHolderName || ''}
                    onChange={(e) => updateBankDetails('accountHolderName', e.target.value)}
                    placeholder="As per bank records"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={(Array.isArray(profile.bankDetails) ? profile.bankDetails[0] : profile.bankDetails)?.accountNumber || ''}
                    onChange={(e) => updateBankDetails('accountNumber', e.target.value)}
                    placeholder="Enter account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC / Swift Code</Label>
                  <Input
                    id="ifscCode"
                    value={(Array.isArray(profile.bankDetails) ? profile.bankDetails[0] : profile.bankDetails)?.ifscCode || ''}
                    onChange={(e) => updateBankDetails('ifscCode', e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} className="gap-2">
                <Save className="h-4 w-4" />
                Save Bank Details
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template Tab */}
        <TabsContent value="template" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {selectedTemplate === 'invoice' ? 'Invoice Template Customization' : 'Quote Template Customization'}
                  </CardTitle>
                  <CardDescription>
                    {selectedTemplate === 'invoice'
                      ? 'Control what fields appear on your invoices.'
                      : 'Control what fields appear on your quotes.'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedTemplate === 'invoice' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTemplate('invoice')}
                  >
                    Invoice
                  </Button>
                  <Button
                    variant={selectedTemplate === 'quote' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTemplate('quote')}
                  >
                    Quote
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'showLogo', label: 'Show Business Logo' },
                  { key: 'showTaxBreakdown', label: 'Show Tax Breakdown Table' },
                  { key: 'showHsnSac', label: 'Show HSN/SAC Codes' },
                  { key: 'showQuantity', label: 'Show Quantity Column' },
                  { key: 'showUnit', label: 'Show Unit Column' },
                  { key: 'showDiscount', label: 'Show Discount Column' },
                  { key: 'showShippingAddress', label: 'Show Shipping Address' },
                  { key: 'showBankDetails', label: 'Show Bank Details' },
                  { key: 'showSignature', label: 'Show Signature Line' },
                  { key: 'showQRCode', label: 'Show QR Code' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <Label className="font-normal cursor-pointer">{label}</Label>
                    <Switch
                      checked={currentTemplate?.[key as keyof InvoiceTemplate] as boolean}
                      onCheckedChange={(checked) => updateTemplate(key, checked)}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Layout</Label>
                  <Select 
                    value={currentTemplate?.layout || 'modern'} 
                    onValueChange={(v) => updateTemplate('layout', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern (Sleek)</SelectItem>
                      <SelectItem value="traditional">Traditional (Industrial/GST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Border Radius (e.g. 8px)</Label>
                  <Input 
                    value={currentTemplate?.borderRadius || '8px'}
                    onChange={(e) => updateTemplate('borderRadius', e.target.value)}
                    placeholder="8px"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={currentTemplate?.primaryColor || '#0f172a'}
                      onChange={(e) => updateTemplate('primaryColor', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={currentTemplate?.primaryColor || '#0f172a'}
                      onChange={(e) => updateTemplate('primaryColor', e.target.value)}
                      placeholder="#0f172a"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={currentTemplate?.accentColor || '#3b82f6'}
                      onChange={(e) => updateTemplate('accentColor', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={currentTemplate?.accentColor || '#3b82f6'}
                      onChange={(e) => updateTemplate('accentColor', e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select 
                    value={currentTemplate?.fontFamily || 'Inter'} 
                    onValueChange={(v) => updateTemplate('fontFamily', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter (Sans)</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Outfit">Outfit (Modern)</SelectItem>
                      <SelectItem value="Playfair Display">Playfair (Serif)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Border Style</Label>
                  <Select 
                    value={currentTemplate?.borderRadius || '8px'} 
                    onValueChange={(v) => updateTemplate('borderRadius', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0px">Sharp</SelectItem>
                      <SelectItem value="4px">Slightly Rounded</SelectItem>
                      <SelectItem value="8px">Modern Rounded</SelectItem>
                      <SelectItem value="16px">Very Rounded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={currentTemplate?.name || ''}
                  onChange={(e) => updateTemplate('name', e.target.value)}
                  placeholder="Template name"
                />
              </div>
              <div className="space-y-2">
                <Label>Header Text</Label>
                <Input
                  value={currentTemplate?.headerText || ''}
                  onChange={(e) => updateTemplate('headerText', e.target.value)}
                  placeholder="Custom header text (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label>Footer Text</Label>
                <Textarea
                  value={currentTemplate?.footerText || ''}
                  onChange={(e) => updateTemplate('footerText', e.target.value)}
                  placeholder="Custom footer text, e.g. payment instructions, thank you message..."
                  rows={3}
                />
              </div>

              <Button onClick={handleSaveTemplate} className="gap-2">
                <Save className="h-4 w-4" />
                Save Template Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Data Privacy & GDPR</CardTitle>
              <CardDescription>
                Manage your data and exercise your privacy rights under GDPR and other regulations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Download className="h-4 w-4 text-primary" />
                      Export Your Data
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Download all your personal data, invoices, and business information in a machine-readable JSON format.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportData} 
                    disabled={isExporting}
                    className="shrink-0"
                  >
                    {isExporting ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Export JSON
                  </Button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete your account and all associated data. This action is irreversible.
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleDeleteAccount} 
                    disabled={isDeleting}
                    className="shrink-0"
                  >
                    {isDeleting ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete Permanently
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Compliance Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">GDPR Compliant</p>
                      <p className="text-[10px] text-muted-foreground">Verified for 2026 standards</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">SOC 2 Type 2</p>
                      <p className="text-[10px] text-muted-foreground">Technical controls implemented</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  By using Quotiq, you agree to our{' '}
                  <a href="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</a> and{' '}
                  <a href="/security" className="text-primary hover:underline" target="_blank">Security Policy</a>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
