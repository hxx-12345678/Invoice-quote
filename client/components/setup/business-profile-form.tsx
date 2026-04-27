'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BusinessProfile, 
  BusinessType, 
  TaxSystem,
  BankDetails 
} from '@/lib/types';
import { 
  BusinessProfileStore, 
  UserSettingsStore, 
  AuthStore,
  COUNTRY_TAX_CONFIGS, 
  CURRENCIES,
  generateId,
  getDefaultUserSettings,
  seedDemoData
} from '@/lib/store';
import { ApiService } from '@/lib/api-service';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Globe, 
  Landmark, 
  User,
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';

const BUSINESS_TYPES: { value: BusinessType; label: string; description: string }[] = [
  { value: 'freelancer', label: 'Freelancer', description: 'Individual professional working independently' },
  { value: 'sole_proprietor', label: 'Sole Proprietor', description: 'Single owner business without separate legal entity' },
  { value: 'partnership', label: 'Partnership', description: 'Business owned by two or more partners' },
  { value: 'llp', label: 'LLP', description: 'Limited Liability Partnership' },
  { value: 'private_limited', label: 'Private Limited', description: 'Private limited company (Pvt Ltd)' },
  { value: 'enterprise', label: 'Enterprise', description: 'Large corporation with multiple teams' },
];

interface BusinessProfileFormProps {
  onComplete: (profile: BusinessProfile) => void;
  guestMode?: boolean;
}

export function BusinessProfileForm({ onComplete, guestMode = false }: BusinessProfileFormProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    businessType: '' as BusinessType,
    businessName: '',
    legalName: '',
    registrationNumber: '',
    taxId: '',
    panNumber: '',
    country: '',
    state: '',
    city: '',
    address: '',
    pincode: '',
    email: '',
    phone: '',
    website: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    swiftCode: '',
    routingNumber: '',
    iban: '',
    accountHolderName: '',
    branch: '',
  });

  const selectedCountry = COUNTRY_TAX_CONFIGS.find(c => c.country === formData.country);
  const selectedCurrency = CURRENCIES.find(c => 
    (formData.country === 'India' && c.code === 'INR') ||
    (formData.country === 'United States' && c.code === 'USD') ||
    (formData.country === 'United Kingdom' && c.code === 'GBP') ||
    (formData.country === 'Germany' && c.code === 'EUR') ||
    (formData.country === 'France' && c.code === 'EUR') ||
    (formData.country === 'Canada' && c.code === 'CAD') ||
    (formData.country === 'Australia' && c.code === 'AUD') ||
    (formData.country === 'Singapore' && c.code === 'SGD') ||
    (formData.country === 'UAE' && c.code === 'AED')
  ) || CURRENCIES[0];

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLoadDemo = () => {
    seedDemoData();
    const profile = BusinessProfileStore.get();
    if (profile) {
      onComplete(profile);
    }
  };

  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const bankDetails: any = formData.bankName ? {
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode || undefined,
        swiftCode: formData.swiftCode || undefined,
        routingNumber: formData.routingNumber || undefined,
        iban: formData.iban || undefined,
        accountHolderName: formData.accountHolderName,
        branch: formData.branch || undefined,
      } : undefined;

      const profileData = {
        businessType: formData.businessType,
        businessName: formData.businessName,
        legalName: formData.legalName || formData.businessName,
        registrationNumber: formData.registrationNumber || undefined,
        taxId: formData.taxId || undefined,
        panNumber: formData.panNumber || undefined,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        address: formData.address,
        pincode: formData.pincode,
        email: formData.email,
        phone: formData.phone,
        website: formData.website || undefined,
        bankDetails: bankDetails || undefined,
      };

      if (guestMode) {
        // In guest mode, save to localStorage and redirect to register
        if (typeof window !== 'undefined') {
          localStorage.setItem('pending_business_profile', JSON.stringify(profileData));
          localStorage.setItem('pending_user_settings', JSON.stringify({
            currency: selectedCurrency.code,
            taxSystem: selectedCountry?.taxSystem || 'NONE',
            defaultTaxRate: selectedCountry?.defaultTaxRate || 0,
          }));
        }
        
        toast({
          title: 'Profile Saved',
          description: 'Now create an account to save your data and access the platform.',
        });
        
        router.push('/register?from=setup');
        return;
      }

      const response = await ApiService.business.create(profileData);
      const profile = response.data.data;

      BusinessProfileStore.set(profile);

      // Create user settings
      const settingsData = {
        currency: selectedCurrency.code,
        taxSystem: selectedCountry?.taxSystem || 'NONE',
        defaultTaxRate: selectedCountry?.defaultTaxRate || 0,
      };

      const settingsRes = await ApiService.settings.update(settingsData);
      UserSettingsStore.set(settingsRes.data.data);

      toast({
        title: 'Profile Created',
        description: 'Your business profile has been set up successfully.',
      });

      onComplete(profile);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Setup Failed',
        description: error.response?.data?.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return !!formData.businessType;
      case 2:
        return !!formData.businessName && !!formData.email && !!formData.phone;
      case 3:
        return !!formData.country && !!formData.city && !!formData.address;
      case 4:
        return true; // Bank details are optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Set Up Your Business Profile
          </h1>
          <p className="text-muted-foreground">
            Configure your business details to start creating professional invoices
          </p>
          <Button 
            variant="outline" 
            className="mt-4 gap-2"
            onClick={handleLoadDemo}
          >
            <Sparkles className="h-4 w-4" />
            Load Demo Data
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s === step
                    ? 'bg-primary text-primary-foreground'
                    : s < step
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 mx-1 rounded ${
                    s < step ? 'bg-primary/20' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === 1 && <><Building2 className="h-5 w-5" /> Business Type</>}
              {step === 2 && <><User className="h-5 w-5" /> Business Details</>}
              {step === 3 && <><Globe className="h-5 w-5" /> Location & Tax</>}
              {step === 4 && <><Landmark className="h-5 w-5" /> Bank Details</>}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Select the type of business you operate'}
              {step === 2 && 'Enter your business information'}
              {step === 3 && 'Set up your location and tax configuration'}
              {step === 4 && 'Add your bank details for invoices (optional)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Business Type */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BUSINESS_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleChange('businessType', type.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${
                      formData.businessType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="font-medium text-foreground">{type.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {type.description}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Business Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      placeholder="Your Business Name"
                      value={formData.businessName}
                      onChange={(e) => handleChange('businessName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Legal Name</Label>
                    <Input
                      id="legalName"
                      placeholder="Legal registered name"
                      value={formData.legalName}
                      onChange={(e) => handleChange('legalName', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Business Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="billing@business.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
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
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://business.com"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Registration Number</Label>
                    <Input
                      id="registrationNumber"
                      placeholder="Company registration number"
                      value={formData.registrationNumber}
                      onChange={(e) => handleChange('registrationNumber', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location & Tax */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => {
                        handleChange('country', value);
                        handleChange('state', '');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
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
                      <Label htmlFor="state">State/Province *</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) => handleChange('state', value)}
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
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="City name"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">PIN/ZIP Code *</Label>
                    <Input
                      id="pincode"
                      placeholder="Postal code"
                      value={formData.pincode}
                      onChange={(e) => handleChange('pincode', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Business Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Full business address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    rows={3}
                  />
                </div>
                {selectedCountry && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="taxId">{selectedCountry.taxIdLabel}</Label>
                      <Input
                        id="taxId"
                        placeholder={`Enter ${selectedCountry.taxIdLabel}`}
                        value={formData.taxId}
                        onChange={(e) => handleChange('taxId', e.target.value)}
                      />
                    </div>
                    {formData.country === 'India' && (
                      <div className="space-y-2">
                        <Label htmlFor="panNumber">PAN Number</Label>
                        <Input
                          id="panNumber"
                          placeholder="ABCDE1234F"
                          value={formData.panNumber}
                          onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                        />
                      </div>
                    )}
                  </div>
                )}
                {selectedCountry && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm font-medium text-foreground">Tax Configuration</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Tax System: <span className="font-medium">{selectedCountry.taxSystem}</span> | 
                      Default Rate: <span className="font-medium">{selectedCountry.defaultTaxRate}%</span> | 
                      Currency: <span className="font-medium">{selectedCurrency.code} ({selectedCurrency.symbol})</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Bank Details */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground">
                    Bank details will appear on your invoices for payment. This step is optional.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      placeholder="Bank name"
                      value={formData.bankName}
                      onChange={(e) => handleChange('bankName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Input
                      id="branch"
                      placeholder="Branch name"
                      value={formData.branch}
                      onChange={(e) => handleChange('branch', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="Account number"
                      value={formData.accountNumber}
                      onChange={(e) => handleChange('accountNumber', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountHolderName">Account Holder Name</Label>
                    <Input
                      id="accountHolderName"
                      placeholder="Name on account"
                      value={formData.accountHolderName}
                      onChange={(e) => handleChange('accountHolderName', e.target.value)}
                    />
                  </div>
                </div>
                {formData.country === 'India' && (
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      placeholder="HDFC0001234"
                      value={formData.ifscCode}
                      onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
                    />
                  </div>
                )}
                {formData.country === 'United States' && (
                  <div className="space-y-2">
                    <Label htmlFor="routingNumber">Routing Number</Label>
                    <Input
                      id="routingNumber"
                      placeholder="Routing number"
                      value={formData.routingNumber}
                      onChange={(e) => handleChange('routingNumber', e.target.value)}
                    />
                  </div>
                )}
                {['United Kingdom', 'Germany', 'France'].includes(formData.country) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="iban">IBAN</Label>
                      <Input
                        id="iban"
                        placeholder="International Bank Account Number"
                        value={formData.iban}
                        onChange={(e) => handleChange('iban', e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="swiftCode">SWIFT/BIC Code</Label>
                      <Input
                        id="swiftCode"
                        placeholder="SWIFT code"
                        value={formData.swiftCode}
                        onChange={(e) => handleChange('swiftCode', e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1 || isLoading}
              >
                Back
              </Button>
              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed(step)}
                  className="gap-2"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
